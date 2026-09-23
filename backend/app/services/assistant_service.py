"""
Smart Recycling Assistant.

A rule-based, keyword-matching Q&A engine over a curated knowledge base
of practical, safety-conscious recycling/disposal guidance. This keeps
the assistant fully functional without requiring an external LLM API
key; the function signature is small enough to later route to a real
LLM if one is configured.
"""
import re

KNOWLEDGE_BASE = [
    {
        "keywords": ["battery", "batteries"],
        "intent": "battery_disposal",
        "reply": "Batteries should never go in regular trash or standard recycling bins — they can cause fires when crushed. Take household batteries (AA/AAA, button cells, rechargeables) to a battery drop-off point, often available at electronics or hardware stores. Larger lithium-ion or car batteries need a certified e-waste or auto-parts collection point.",
        "followups": ["Where can I recycle e-waste?", "Is a phone battery hazardous?"],
    },
    {
        "keywords": ["e-waste", "electronic", "electronics", "phone", "laptop", "computer", "circuit"],
        "intent": "ewaste_disposal",
        "reply": "Electronics contain both valuable recoverable materials and hazardous components, so they should go to a certified e-waste recycling center rather than general trash. Many manufacturers and electronics retailers also offer take-back programs. Check the Recycling Centers page and filter by 'E-Waste' to find one near you.",
        "followups": ["How should I dispose of batteries?", "Where can I recycle e-waste?"],
    },
    {
        "keywords": ["plastic bottle", "pet plastic", "plastic bag", "plastic packaging", "plastic"],
        "intent": "plastic_recycling",
        "reply": "Most rigid plastics (bottles, jugs, tubs marked #1 PET or #2 HDPE) are widely recyclable — rinse them and remove caps if your program sorts separately. Thin plastic films and bags usually are NOT accepted in curbside recycling and often need a dedicated store drop-off instead.",
        "followups": ["How can I reduce plastic waste?", "Is packaging recyclable?"],
    },
    {
        "keywords": ["glass", "jar", "bottle"],
        "intent": "glass_recycling",
        "reply": "Glass bottles and jars are recyclable indefinitely without losing quality — rinse them and place them with glass recycling, separate from ceramics, mirrors, or window glass, which are usually not accepted in the same stream.",
        "followups": ["Can this item be recycled?", "Where's my nearest recycling center?"],
    },
    {
        "keywords": ["paper", "cardboard", "box", "newspaper"],
        "intent": "paper_recycling",
        "reply": "Clean, dry paper and cardboard are recyclable — flatten boxes to save space. Greasy or food-soiled paper (like a pizza box bottom) generally can't be recycled and should be composted or trashed instead.",
        "followups": ["Is this packaging recyclable?", "Can this item be recycled?"],
    },
    {
        "keywords": ["food", "organic", "compost", "yard waste", "leftovers"],
        "intent": "organic_waste",
        "reply": "Food scraps and yard waste are best composted if you have access to a composting program or backyard bin — this diverts methane-producing waste from landfill. Otherwise, use your municipality's organic/green waste collection where available.",
        "followups": ["How can I reduce plastic waste?", "How is my sustainability score calculated?"],
    },
    {
        "keywords": ["reduce plastic", "reduce waste", "less waste", "minimize waste"],
        "intent": "reduction_tips",
        "reply": "A few high-impact habits: switch to a refillable water bottle, bring reusable bags, buy in bulk to cut packaging, and choose products with minimal or recyclable packaging. Your Dashboard's AI recommendations also personalize suggestions based on your actual logged waste categories.",
        "followups": ["How is my sustainability score calculated?", "Can this item be recycled?"],
    },
    {
        "keywords": ["recycling center", "nearest", "drop off", "where can i recycle"],
        "intent": "find_center",
        "reply": "Head to the Recycling Centers page and use the category filter (Plastic, Paper, Glass, Metal, E-Waste) to find nearby drop-off points, along with accepted materials and directions.",
        "followups": ["How should I dispose of batteries?", "Is this packaging recyclable?"],
    },
    {
        "keywords": ["sustainability score", "my score", "how is my score"],
        "intent": "score_explainer",
        "reply": "Your sustainability score blends four factors from your real activity: recycling rate, waste reduction over time, consistency of logging/scanning, and responsible disposal (based on scan outcomes). You can see the full breakdown on your Dashboard.",
        "followups": ["How can I reduce plastic waste?", "Can this item be recycled?"],
    },
    {
        "keywords": ["can this be recycled", "can this item be recycled", "is this recyclable", "recyclable"],
        "intent": "general_recyclability",
        "reply": "The fastest way to check is our AI Waste Scanner — upload or take a photo and it will classify the material and recyclability with a confidence score and a specific recommendation. In general: clean plastics, paper, glass, and metal are recyclable; food-soiled items, mixed-material packaging, and electronics need special handling.",
        "followups": ["How should I dispose of batteries?", "Where can I recycle e-waste?"],
    },
]

FALLBACK_REPLY = "I don't have a specific answer for that yet, but I can help with recycling and disposal questions about plastics, paper, glass, metal, e-waste, batteries, and general waste reduction. Try rephrasing, or use the AI Waste Scanner to classify a specific item."

SUGGESTED_QUESTIONS = [
    "Can this item be recycled?",
    "How should I dispose of batteries?",
    "Is this packaging recyclable?",
    "Where can I recycle e-waste?",
    "How can I reduce plastic waste?",
]


def answer(message: str) -> dict:
    text = message.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    best_match = None
    best_score = 0
    for entry in KNOWLEDGE_BASE:
        score = sum(1 for kw in entry["keywords"] if kw in text)
        if score > best_score:
            best_score = score
            best_match = entry

    if best_match and best_score > 0:
        return {
            "reply": best_match["reply"],
            "suggested_followups": best_match["followups"],
            "intent": best_match["intent"],
        }

    return {
        "reply": FALLBACK_REPLY,
        "suggested_followups": SUGGESTED_QUESTIONS[:3],
        "intent": "fallback",
    }
