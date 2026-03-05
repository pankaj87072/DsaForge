"""
DSAForge Adaptive Algorithm (Non-AI Mode)
==========================================

This module provides a complete internal scoring engine that works WITHOUT
any AI API. It uses a multi-factor weighted formula to:

1. Compute a MASTERY SCORE per topic (0–100)
2. Identify WEAK topics algorithmically
3. Compute an overall READINESS SCORE
4. Recommend which questions to prioritize next
5. Determine company clearance based on actual performance

FORMULA OVERVIEW
----------------
Topic Mastery Score (TMS) = weighted sum of 4 factors:

  Factor 1 — Solve Rate (40% weight)
    = solved / (solved + attempted)
    → Are you actually solving what you try?

  Factor 2 — Coverage (25% weight)
    = solved / total_questions_in_topic
    → How much of the topic have you covered?

  Factor 3 — Speed Score (20% weight)
    = 1 - min(avg_time / EXPECTED_TIME[difficulty], 1)
    → Are you solving at a reasonable pace?
    → Easy: expected 10 min, Medium: 20 min, Hard: 35 min

  Factor 4 — Consistency Score (15% weight)
    = (recent_solved_last_5 / 5) — momentum indicator
    → Are you consistently solving or spiking?

Overall Readiness Score (ORS) = weighted average of all topic TMSs
  weighted by topic importance at user's current level

Weakness threshold: TMS < 50  →  weak topic
Strong threshold:   TMS >= 75  →  strong topic

Company Clearance:
  Each company has required_topics[] with min_mastery thresholds
  → Only shown as clearable if user meets ALL required thresholds
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field

# ─── Constants ────────────────────────────────────────────────────────────────

EXPECTED_TIME_SECONDS = {
    "Easy": 10 * 60,    # 10 minutes
    "Medium": 20 * 60,  # 20 minutes
    "Hard": 35 * 60,    # 35 minutes
}

# How many questions exist per topic at each level (from questions.py)
TOPIC_COUNTS = {
    "beginner": {
        "Arrays": 8, "Strings": 5, "Linked Lists": 4,
        "Trees": 3, "Math": 4, "Hashing": 2,
        "Dynamic Programming": 1, "Sorting": 2, "Two Pointers": 1,
    },
    "intermediate": {
        "Arrays": 5, "Two Pointers": 1, "Sliding Window": 2,
        "Binary Search": 2, "Strings": 4, "Trees": 5,
        "Dynamic Programming": 4, "Greedy": 1, "Graphs": 4,
        "Stack": 4, "Heap": 2,
    },
    "advanced": {
        "Dynamic Programming": 5, "Graphs": 4, "Sliding Window": 2,
        "Binary Search": 2, "Trees": 3, "Backtracking": 3,
        "Heap": 2, "Trie": 2, "Bit Manipulation": 2,
        "Design": 4, "Arrays": 1,
    }
}

# Topic importance weights by level (sum = 1.0)
TOPIC_WEIGHTS = {
    "beginner": {
        "Arrays": 0.25, "Strings": 0.20, "Linked Lists": 0.15,
        "Trees": 0.10, "Math": 0.10, "Hashing": 0.10,
        "Dynamic Programming": 0.05, "Sorting": 0.03, "Two Pointers": 0.02,
    },
    "intermediate": {
        "Arrays": 0.15, "Graphs": 0.18, "Trees": 0.15,
        "Dynamic Programming": 0.15, "Sliding Window": 0.08,
        "Binary Search": 0.07, "Stack": 0.07, "Heap": 0.06,
        "Strings": 0.05, "Two Pointers": 0.04,
    },
    "advanced": {
        "Dynamic Programming": 0.22, "Graphs": 0.20, "Trees": 0.12,
        "Backtracking": 0.10, "Design": 0.12, "Heap": 0.08,
        "Trie": 0.06, "Sliding Window": 0.04,
        "Binary Search": 0.03, "Bit Manipulation": 0.03,
    }
}


@dataclass
class TopicStats:
    topic: str
    level: str
    solved: int = 0
    attempted: int = 0   # failed attempts (status="attempted")
    skipped: int = 0
    total_time_seconds: int = 0
    solve_times: List[int] = field(default_factory=list)
    last_5_results: List[str] = field(default_factory=list)  # "solved"/"failed"


@dataclass
class TopicMastery:
    topic: str
    mastery_score: float      # 0–100
    solve_rate: float          # 0–1
    coverage: float            # 0–1
    speed_score: float         # 0–1
    consistency_score: float   # 0–1
    solved: int
    attempted: int
    label: str                 # "Strong" / "Learning" / "Weak" / "Not Started"
    priority: int              # 1=high priority to practice, 3=low


@dataclass  
class AdaptiveReport:
    overall_score: float              # 0–100
    readiness_label: str              # "Beginner Ready" / "Intermediate Ready" / etc.
    topic_mastery: List[TopicMastery]
    weak_topics: List[str]
    strong_topics: List[str]
    next_recommended_topics: List[str]
    improvement_tips: Dict[str, str]
    questions_to_prioritize: List[str]  # question IDs
    level_progression_pct: float        # % toward next level unlock


# ─── Main Computation ─────────────────────────────────────────────────────────

def compute_topic_mastery(stats: TopicStats) -> TopicMastery:
    """
    Compute mastery score for a single topic using 4-factor formula.
    """
    total_attempts = stats.solved + stats.attempted
    total_questions = TOPIC_COUNTS.get(stats.level, {}).get(stats.topic, 5)

    # Factor 1: Solve Rate (40%)
    if total_attempts == 0:
        solve_rate = 0.0
    else:
        solve_rate = stats.solved / total_attempts

    # Factor 2: Coverage (25%)
    coverage = min(stats.solved / max(total_questions, 1), 1.0)

    # Factor 3: Speed Score (20%)
    if stats.solve_times:
        avg_time = sum(stats.solve_times) / len(stats.solve_times)
        # Use Medium as default expected time
        expected = EXPECTED_TIME_SECONDS["Medium"]
        speed_score = max(0.0, 1.0 - (avg_time / (expected * 1.5)))
    else:
        speed_score = 0.5  # neutral if no timing data

    # Factor 4: Consistency Score (15%)
    if stats.last_5_results:
        recent_solved = sum(1 for r in stats.last_5_results if r == "solved")
        consistency_score = recent_solved / len(stats.last_5_results)
    else:
        consistency_score = 0.0

    # Weighted sum → 0-100
    raw_score = (
        solve_rate        * 0.40 +
        coverage          * 0.25 +
        speed_score       * 0.20 +
        consistency_score * 0.15
    )
    mastery_score = round(raw_score * 100, 1)

    # Label
    if total_attempts == 0:
        label = "Not Started"
        priority = 1
    elif mastery_score >= 75:
        label = "Strong"
        priority = 3
    elif mastery_score >= 50:
        label = "Learning"
        priority = 2
    else:
        label = "Weak"
        priority = 1

    return TopicMastery(
        topic=stats.topic,
        mastery_score=mastery_score,
        solve_rate=round(solve_rate * 100, 1),
        coverage=round(coverage * 100, 1),
        speed_score=round(speed_score * 100, 1),
        consistency_score=round(consistency_score * 100, 1),
        solved=stats.solved,
        attempted=stats.attempted,
        label=label,
        priority=priority,
    )


def compute_adaptive_report(
    user_level: str,
    progress_records: list,  # list of UserProgress ORM objects
    all_questions: list,      # full question list for that level
) -> AdaptiveReport:
    """
    Main entry point. Takes raw DB progress records and returns full
    adaptive analysis report without needing any AI API.
    """
    # Build topic stats from progress records
    topic_stats_map: Dict[str, TopicStats] = {}

    # Track per-question timing and recency
    topic_recent: Dict[str, List[str]] = {}  # topic → last N results

    # Sort by created_at to get recency ordering
    sorted_records = sorted(progress_records, key=lambda r: r.created_at or r.id)

    for rec in sorted_records:
        topic = rec.topic
        if topic not in topic_stats_map:
            topic_stats_map[topic] = TopicStats(topic=topic, level=user_level)
            topic_recent[topic] = []

        ts = topic_stats_map[topic]
        if rec.status == "solved":
            ts.solved += 1
            if rec.time_taken_seconds and rec.time_taken_seconds > 0:
                ts.solve_times.append(rec.time_taken_seconds)
            topic_recent[topic].append("solved")
        elif rec.status == "attempted":
            ts.attempted += 1
            topic_recent[topic].append("failed")
        elif rec.status == "skipped":
            ts.skipped += 1

    # Keep only last 5 for recency
    for topic, results in topic_recent.items():
        topic_stats_map[topic].last_5_results = results[-5:]

    # Compute mastery per topic
    mastery_list: List[TopicMastery] = []
    for topic, stats in topic_stats_map.items():
        mastery_list.append(compute_topic_mastery(stats))

    # Sort by mastery score
    mastery_list.sort(key=lambda m: m.mastery_score)

    # Overall Readiness Score — weighted by topic importance
    weights = TOPIC_WEIGHTS.get(user_level, {})
    total_weight = 0.0
    weighted_sum = 0.0

    for m in mastery_list:
        w = weights.get(m.topic, 0.02)
        weighted_sum += m.mastery_score * w
        total_weight += w

    # Add penalty for untouched important topics
    all_topics_at_level = set(weights.keys())
    touched_topics = set(m.topic for m in mastery_list)
    untouched_important = all_topics_at_level - touched_topics
    for topic in untouched_important:
        w = weights.get(topic, 0.02)
        weighted_sum += 0 * w  # 0 score for untouched
        total_weight += w

    if total_weight > 0:
        overall_score = round(weighted_sum / total_weight, 1)
    else:
        overall_score = 0.0

    # Clamp
    overall_score = max(0.0, min(100.0, overall_score))

    # Readiness label
    if overall_score >= 80:
        readiness_label = "Advanced Ready 🔥"
    elif overall_score >= 60:
        readiness_label = "Intermediate Ready ⚡"
    elif overall_score >= 35:
        readiness_label = "Building Foundation 🌱"
    else:
        readiness_label = "Just Getting Started 🚀"

    # Weak / Strong topics
    weak_topics = [m.topic for m in mastery_list if m.mastery_score < 50 and (m.solved + m.attempted) > 0]
    strong_topics = [m.topic for m in mastery_list if m.mastery_score >= 75]

    # Recommend: prioritize weak topics first, then not-started important ones
    priority_order = sorted(mastery_list, key=lambda m: (m.priority, m.mastery_score))
    next_recommended = [m.topic for m in priority_order if m.label != "Strong"][:3]

    # Also add untouched important topics to recommendations
    for topic in untouched_important:
        w = weights.get(topic, 0)
        if w >= 0.10 and topic not in next_recommended:
            next_recommended.append(topic)
    next_recommended = next_recommended[:4]

    # Improvement tips per weak topic
    improvement_tips = _generate_improvement_tips(
        [m for m in mastery_list if m.mastery_score < 60]
    )

    # Which specific questions to prioritize (from weak topics, unsolved first)
    solved_ids = set(r.question_id for r in progress_records if r.status == "solved")
    attempted_ids = set(r.question_id for r in progress_records if r.status == "attempted")

    priority_questions = []
    for q in all_questions:
        if q["topic"] in weak_topics and q["id"] not in solved_ids:
            priority_questions.append(q["id"])

    # Level progression % (toward unlock: need 20 solved + 60% rate)
    total_solved = sum(1 for r in progress_records if r.status == "solved")
    total_attempted_all = sum(1 for r in progress_records if r.status in ["solved", "attempted"])
    rate = total_solved / total_attempted_all if total_attempted_all > 0 else 0
    solve_progress = min(total_solved / 20.0, 1.0) * 50  # 50% weight on count
    rate_progress = min(rate / 0.60, 1.0) * 50           # 50% weight on rate
    level_progression_pct = round(solve_progress + rate_progress, 1)

    return AdaptiveReport(
        overall_score=overall_score,
        readiness_label=readiness_label,
        topic_mastery=mastery_list,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        next_recommended_topics=next_recommended,
        improvement_tips=improvement_tips,
        questions_to_prioritize=priority_questions[:10],
        level_progression_pct=level_progression_pct,
    )


def _generate_improvement_tips(weak_masteries: List[TopicMastery]) -> Dict[str, str]:
    """
    Rule-based tips based on WHICH factor is lowest for each weak topic.
    No AI needed — pure logic.
    """
    TOPIC_TIPS = {
        "Arrays": {
            "solve_rate": "Practice two-pointer and sliding window patterns on arrays — most array problems use one of these two techniques.",
            "coverage": "You haven't tried enough array problems. Start with Two Sum, then move to subarray problems.",
            "speed": "Arrays problems should be solved in 10-15 min. Practice recognizing the pattern (prefix sum, two pointer, hash) before coding.",
            "consistency": "Your recent array attempts are inconsistent. Revisit the basics: index manipulation and in-place operations.",
        },
        "Trees": {
            "solve_rate": "Most tree problems use recursion with a base case of null node. Write the recursive signature first, then fill it in.",
            "coverage": "Solve more tree problems — cover inorder/preorder traversal, then move to path problems.",
            "speed": "For trees, write the recursive solution first, optimize later. Don't overthink the base case.",
            "consistency": "Re-practice DFS and BFS on trees. These two patterns cover 80% of tree interview problems.",
        },
        "Dynamic Programming": {
            "solve_rate": "DP is hard. Start by identifying: (1) optimal substructure, (2) overlapping subproblems. Then write the recurrence.",
            "coverage": "DP needs more reps. Solve climbing stairs → coin change → longest subsequence in that order.",
            "speed": "Write the recursive solution with memoization first — bottom-up optimization can come later.",
            "consistency": "DP inconsistency usually means the pattern hasn't clicked. Focus on just 2-3 DP patterns before moving on.",
        },
        "Graphs": {
            "solve_rate": "Most graph problems are BFS or DFS. Identify: weighted/unweighted, directed/undirected, then pick the algorithm.",
            "coverage": "Practice graph traversal first (number of islands), then move to cycle detection and shortest path.",
            "speed": "Graphs need practice with adjacency list vs matrix. Build the graph representation first, then run your traversal.",
            "consistency": "Graph problems need a template. Practice this: build graph → run BFS/DFS → process results.",
        },
        "Strings": {
            "solve_rate": "Most string problems use a hash map to count characters or a two-pointer on the string itself.",
            "coverage": "Cover: anagram check → palindrome → substring → then harder sliding window string problems.",
            "speed": "Strings in Python/Java have built-in methods that solve half the problem. Know your language's string API.",
            "consistency": "Practice recognizing string patterns: character frequency, sliding window, and two-pointer.",
        },
        "Linked Lists": {
            "solve_rate": "Linked list problems need clean pointer manipulation. Draw the pointers before coding.",
            "coverage": "Cover: reverse → detect cycle → merge sorted → then harder problems.",
            "speed": "Use dummy head nodes and two-pointer (slow/fast) — these two techniques handle most linked list problems.",
            "consistency": "Linked list bugs usually come from off-by-one errors. Trace through with a small example (3 nodes).",
        },
        "Heap": {
            "solve_rate": "Heaps solve 'K-th largest/smallest' instantly. Know when to use min-heap vs max-heap.",
            "coverage": "Practice: kth largest → top K frequent → merge K sorted lists.",
            "speed": "Push into heap, then pop when size > K. This one pattern solves most heap interview problems.",
            "consistency": "Heaps in Python: use heapq. Negate values for max-heap. Practice these two operations until automatic.",
        },
        "Backtracking": {
            "solve_rate": "Backtracking = choose → explore → unchoose. Write this template and all problems follow it.",
            "coverage": "Start with subsets → permutations → combinations → then N-queens.",
            "speed": "Write the recursive template first, add pruning conditions second. Never try to optimize before it works.",
            "consistency": "Backtracking problems all share the same skeleton. Practice recognizing when to add pruning.",
        },
        "Stack": {
            "solve_rate": "Most stack problems use a monotonic stack. If you see 'next greater element' or 'temperature' → it's a stack.",
            "coverage": "Cover: valid parentheses → min stack → daily temperatures → evaluate expression.",
            "speed": "Stack solutions are usually O(n) — if you're thinking O(n²), there's a stack trick waiting.",
            "consistency": "Practice the pattern: iterate, maintain invariant on stack, process when invariant breaks.",
        },
        "Binary Search": {
            "solve_rate": "Binary search template: left=0, right=n-1, mid=left+(right-left)//2. Master when to do left=mid+1 vs right=mid.",
            "coverage": "Cover: basic search → search rotated array → find minimum → then binary search on answer.",
            "speed": "If you see a sorted array and O(log n) in the constraints, it's binary search. Always.",
            "consistency": "Off-by-one errors kill binary search. Use the template and don't change the loop condition.",
        },
    }

    DEFAULT_TIPS = {
        "solve_rate": "Focus on understanding the pattern before implementing. Look at solutions after 30 min max.",
        "coverage": "Increase your coverage by attempting more questions in this topic systematically.",
        "speed": "Time yourself. If you're over 25 minutes on a medium, look at hints — then finish it.",
        "consistency": "Don't skip this topic. Short daily sessions beat occasional long sessions.",
    }

    tips = {}
    for m in weak_masteries:
        topic_tip_map = TOPIC_TIPS.get(m.topic, DEFAULT_TIPS)

        # Find the lowest factor to give the most targeted advice
        factors = {
            "solve_rate": m.solve_rate,
            "coverage": m.coverage,
            "speed": m.speed_score,
            "consistency": m.consistency_score,
        }
        # Weight: solve_rate and consistency are most actionable
        if m.solve_rate < 40:
            key = "solve_rate"
        elif m.coverage < 30:
            key = "coverage"
        elif m.consistency_score < 40:
            key = "consistency"
        else:
            key = "speed"

        tips[m.topic] = topic_tip_map.get(key, DEFAULT_TIPS[key])

    return tips


def compute_company_clearance(
    user_level: str,
    topic_mastery_map: Dict[str, float],  # {topic: mastery_score}
    all_companies: list,
) -> list:
    """
    Return list of companies user can clear based on ACTUAL topic mastery scores.
    
    Company clearance requires:
    1. User level >= company min_level  
    2. Average mastery on company's strong_topics >= required threshold
    
    Thresholds by company tier:
    - FAANG: avg mastery on strong topics >= 65
    - Tier1 other: >= 55
    - Tier2: >= 45
    - Tier3 India: >= 35
    """
    TIER_THRESHOLDS = {
        "tier1_faang": 65,
        "tier1_other": 55,
        "tier2": 45,
        "tier3_india": 35,
    }

    level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    user_level_num = level_map.get(user_level, 0)

    clearable = []
    for company in all_companies:
        company_level_num = level_map.get(company.get("min_level", "intermediate"), 1)

        # Level gate
        if user_level_num < company_level_num:
            continue

        # Topic mastery gate
        strong_topics = company.get("strong_topics", [])
        tier = company.get("tier", "tier2")
        threshold = TIER_THRESHOLDS.get(tier, 45)

        if not strong_topics:
            clearable.append(company)
            continue

        # Score = average mastery on this company's focus topics
        topic_scores = [topic_mastery_map.get(t, 0) for t in strong_topics]
        avg_score = sum(topic_scores) / len(topic_scores)

        if avg_score >= threshold:
            company_with_score = {
                **company,
                "match_score": round(avg_score, 1),
                "topics_matched": [t for t in strong_topics if topic_mastery_map.get(t, 0) >= threshold]
            }
            clearable.append(company_with_score)

    # Sort by match_score descending
    clearable.sort(key=lambda c: c.get("match_score", 0), reverse=True)
    return clearable
