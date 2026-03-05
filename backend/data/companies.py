"""
Companies DSA Level Requirements
Public data - no DB storage needed.
Updated periodically in this file only.
"""

COMPANIES = {
    "tier1_faang": [
        {"name": "Google", "min_level": "intermediate", "strong_topics": ["Graphs","DP","Arrays","Trees"], "logo_color": "#4285F4"},
        {"name": "Meta (Facebook)", "min_level": "intermediate", "strong_topics": ["Arrays","Strings","Graphs","Trees"], "logo_color": "#0866FF"},
        {"name": "Amazon", "min_level": "beginner", "strong_topics": ["Arrays","Trees","DP","Design"], "logo_color": "#FF9900"},
        {"name": "Apple", "min_level": "intermediate", "strong_topics": ["Arrays","Strings","Trees","Design"], "logo_color": "#555555"},
        {"name": "Microsoft", "min_level": "beginner", "strong_topics": ["Arrays","Trees","DP","Graphs"], "logo_color": "#00A4EF"},
        {"name": "Netflix", "min_level": "advanced", "strong_topics": ["Design","DP","Graphs"], "logo_color": "#E50914"},
    ],
    "tier1_other": [
        {"name": "Uber", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#000000"},
        {"name": "Airbnb", "min_level": "intermediate", "strong_topics": ["Arrays","DP","Design"], "logo_color": "#FF5A5F"},
        {"name": "Twitter/X", "min_level": "intermediate", "strong_topics": ["Design","Arrays","Graphs"], "logo_color": "#1DA1F2"},
        {"name": "LinkedIn", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#0A66C2"},
        {"name": "Salesforce", "min_level": "intermediate", "strong_topics": ["Arrays","Trees","Design"], "logo_color": "#00A1E0"},
        {"name": "Adobe", "min_level": "intermediate", "strong_topics": ["Arrays","Strings","DP"], "logo_color": "#FF0000"},
        {"name": "Snap", "min_level": "intermediate", "strong_topics": ["Arrays","Graphs","Design"], "logo_color": "#FFFC00"},
        {"name": "Stripe", "min_level": "advanced", "strong_topics": ["Design","Arrays","DP"], "logo_color": "#6772E5"},
        {"name": "Shopify", "min_level": "intermediate", "strong_topics": ["Arrays","Trees","Design"], "logo_color": "#96BF48"},
        {"name": "Dropbox", "min_level": "intermediate", "strong_topics": ["Design","Arrays"], "logo_color": "#007EE5"},
    ],
    "tier2": [
        {"name": "Oracle", "min_level": "intermediate", "strong_topics": ["Arrays","DB","Trees"], "logo_color": "#F80000"},
        {"name": "IBM", "min_level": "beginner", "strong_topics": ["Arrays","DP","Strings"], "logo_color": "#006699"},
        {"name": "Cisco", "min_level": "intermediate", "strong_topics": ["Graphs","Networks","Design"], "logo_color": "#1BA0D7"},
        {"name": "SAP", "min_level": "intermediate", "strong_topics": ["Arrays","Design","DP"], "logo_color": "#0FAAFF"},
        {"name": "Atlassian", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#0052CC"},
        {"name": "Intuit", "min_level": "intermediate", "strong_topics": ["Arrays","DP","Design"], "logo_color": "#236CFF"},
        {"name": "Palantir", "min_level": "advanced", "strong_topics": ["Graphs","DP","Design","Arrays"], "logo_color": "#101113"},
        {"name": "Coinbase", "min_level": "intermediate", "strong_topics": ["Design","Arrays","Graphs"], "logo_color": "#0052FF"},
        {"name": "DoorDash", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#FF3008"},
        {"name": "Lyft", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#FF00BF"},
        {"name": "Pinterest", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Trees"], "logo_color": "#E60023"},
        {"name": "Reddit", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#FF4500"},
        {"name": "Spotify", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#1DB954"},
        {"name": "GitHub", "min_level": "intermediate", "strong_topics": ["Arrays","Design","Graphs"], "logo_color": "#24292F"},
        {"name": "GitLab", "min_level": "intermediate", "strong_topics": ["Arrays","Design"], "logo_color": "#FC6D26"},
        {"name": "Twilio", "min_level": "intermediate", "strong_topics": ["Design","Arrays"], "logo_color": "#F22F46"},
        {"name": "DataBricks", "min_level": "advanced", "strong_topics": ["Design","DP","Graphs"], "logo_color": "#FF3621"},
        {"name": "Cloudflare", "min_level": "intermediate", "strong_topics": ["Design","Graphs"], "logo_color": "#F38020"},
    ],
    "tier3_india": [
        {"name": "Flipkart", "min_level": "beginner", "strong_topics": ["Arrays","DP","Trees"], "logo_color": "#F7DC00"},
        {"name": "Paytm", "min_level": "beginner", "strong_topics": ["Arrays","Strings"], "logo_color": "#00BAF2"},
        {"name": "Infosys", "min_level": "beginner", "strong_topics": ["Arrays","Strings","Logic"], "logo_color": "#007CC3"},
        {"name": "TCS", "min_level": "beginner", "strong_topics": ["Arrays","Logic","Strings"], "logo_color": "#500050"},
        {"name": "Wipro", "min_level": "beginner", "strong_topics": ["Arrays","Logic","Strings"], "logo_color": "#341C5D"},
        {"name": "HCL", "min_level": "beginner", "strong_topics": ["Arrays","Logic"], "logo_color": "#0052CC"},
        {"name": "Zomato", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#E23744"},
        {"name": "Swiggy", "min_level": "intermediate", "strong_topics": ["Graphs","Arrays","Design"], "logo_color": "#FC8019"},
        {"name": "CRED", "min_level": "intermediate", "strong_topics": ["Arrays","Design","DP"], "logo_color": "#1C1C1C"},
        {"name": "Razorpay", "min_level": "intermediate", "strong_topics": ["Design","Arrays"], "logo_color": "#3395FF"},
        {"name": "PhonePe", "min_level": "intermediate", "strong_topics": ["Design","Arrays"], "logo_color": "#5F259F"},
        {"name": "Meesho", "min_level": "intermediate", "strong_topics": ["Arrays","Design"], "logo_color": "#F43397"},
        {"name": "Ola", "min_level": "intermediate", "strong_topics": ["Graphs","Design"], "logo_color": "#43B244"},
        {"name": "Dream11", "min_level": "intermediate", "strong_topics": ["DP","Arrays","Design"], "logo_color": "#F9423A"},
        {"name": "Groww", "min_level": "intermediate", "strong_topics": ["Arrays","Design"], "logo_color": "#44C3A5"},
        {"name": "Zepto", "min_level": "intermediate", "strong_topics": ["Graphs","Design","Arrays"], "logo_color": "#8B2BE2"},
        {"name": "Nykaa", "min_level": "beginner", "strong_topics": ["Arrays","Design"], "logo_color": "#FC2779"},
        {"name": "PolicyBazaar", "min_level": "beginner", "strong_topics": ["Arrays","Design"], "logo_color": "#01B0ED"},
    ]
}

LEVEL_UNLOCK_REQUIREMENTS = {
    "beginner_to_intermediate": {
        "min_solved": 20,
        "min_success_rate": 0.6,
        "description": "Solve at least 20 beginner problems with 60%+ success rate"
    },
    "intermediate_to_advanced": {
        "min_solved": 20,
        "min_success_rate": 0.65,
        "description": "Solve at least 20 intermediate problems with 65%+ success rate"
    }
}

def get_clearable_companies(level: str, solved_topics: list):
    """Return companies user can likely clear based on their level."""
    clearable = []
    level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    user_level_num = level_map.get(level, 0)
    
    all_companies = []
    for tier in COMPANIES.values():
        all_companies.extend(tier)
    
    for company in all_companies:
        company_level_num = level_map.get(company["min_level"], 1)
        if user_level_num >= company_level_num:
            clearable.append(company)
    
    return clearable

def get_all_companies():
    result = []
    for tier, companies in COMPANIES.items():
        for c in companies:
            result.append({**c, "tier": tier})
    return result
