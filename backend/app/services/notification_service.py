import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import WebSocket

logger = logging.getLogger(__name__)

# Multilingual Early Warning Templates for NER Languages
TRANSLATION_TEMPLATES = {
    "RED": {
        "title": {
            "en": "CRITICAL RED ALERT: Imminent Landslide Risk",
            "hi": "अति संवेदनशील चेतावनी: तत्काल भूस्खलन का खतरा",
            "as": "জৰুৰী সতৰ্কবাৰ্তা: প্ৰচণ্ড ভূমিস্খলনৰ সম্ভাৱনা",
            "bn": "জরুরি লাল সতর্কতা: অবিলম্বে ভূমিধসের আশঙ্কা",
            "mzo": "HRIATTIRNA KHUNKHAN: Leimin hlauhawm zual"
        },
        "message": {
            "en": "Extreme rainfall and slope instability detected in {zone} ({corridor}). Evacuate vulnerable downslope structures immediately. Highway traffic halted.",
            "hi": "{zone} ({corridor}) में अत्यधिक वर्षा और ढलान अस्थिरता दर्ज की गई है। कमजोर संरचनाओं को तुरंत खाली करें। राजमार्ग पर आवाजाही रोक दी गई है।",
            "as": "{zone} ({corridor}) ত প্ৰবল বৰষুণ আৰু পাহাৰ খহি পৰাৰ সম্ভাৱনা। বিপদজনক স্থানৰ পৰা ততাতৈয়াকৈ স্থানান্তৰ হওক।",
            "bn": "{zone} ({corridor}) এলাকায় অতি ভারী বৃষ্টি ও পাহাড় ধসের আশঙ্কা দেখা দিয়েছে। ঝুঁকিপূর্ণ এলাকা অবিলম্বে খালি করুন।",
            "mzo": "{zone} ({corridor}) ah ruah sur nasat avangin leimin hlauhawm tak a awm. Hmun hlauhawm chhuahsan nghal rawh u."
        }
    },
    "ORANGE": {
        "title": {
            "en": "ORANGE WARNING: Severe Landslide Vulnerability",
            "hi": "नारंगी चेतावनी: गंभीर भूस्खलन संवेदनशीलता",
            "as": "কমলা সতৰ্কবাৰ্তা: গভীৰ ভূমিস্খলনৰ আশংকা",
            "bn": "কমলা সতর্কতা: প্রবল ভূমিধসের সম্ভাবনা",
            "mzo": "HRIATTIRNA: Leimin laka fimkhur rawh"
        },
        "message": {
            "en": "72-hour cumulative rainfall exceeds critical saturation thresholds in {zone}. High probability of slope failure and cut-slope debris along {corridor}.",
            "hi": "{zone} में 72 घंटे की बारिश ने संतृप्ति सीमा को पार कर लिया है। {corridor} पर ढलान धंसने का अत्यधिक जोखिम है।",
            "as": "{zone} ত ধাৰাবাহিক বৰষুণৰ বাবে মাটিৰ জলধাৰণ ক্ষমতা শেষ হৈছে। {corridor} ত যাত্ৰা কৰোঁতে সতৰ্ক হওক।",
            "bn": "{zone} এ ৭২ ঘণ্টার বৃষ্টিপাতে মাটি চরম আর্দ্রতায় পৌঁছেছে। {corridor} দিয়ে চলাচলে চরম সতর্কতা অবলম্বন করুন।",
            "mzo": "{zone} ah ruah tui tam lutuk avangin leimin a chhuak thei. {corridor} kalkawngah fimkhur a ngai."
        }
    },
    "YELLOW": {
        "title": {
            "en": "YELLOW WATCH: Elevated Rainfall Watch",
            "hi": "पीली निगरानी: वर्षा और भूस्खलन पर नजर",
            "as": "হালধীয়া নিৰীক্ষণ: বৰষুণ আৰু ভূমিস্খলনৰ নজৰদাৰী",
            "bn": "হলুদ সতর্কতা: বৃষ্টির ওপর নজরদারি",
            "mzo": "FIMKHURNA: Ruah sur thlithlai mek"
        },
        "message": {
            "en": "Active precipitation in {zone}. Automated sensor monitoring active along {corridor}. Travelers advised to check road clearance status.",
            "hi": "{zone} में बारिश जारी है। {corridor} पर सेंसर से निगरानी की जा रही है। यात्री सड़क की स्थिति देखकर ही निकलें।",
            "as": "{zone} ত বৰষুণ অব্যাহত। {corridor} ৰ বাট-পথ পৰীক্ষা কৰিহে যাত্ৰা কৰক।",
            "bn": "{zone} এ বৃষ্টি অব্যাহত। {corridor} এ রাস্তা পরীক্ষা করে যাত্রা করুন।",
            "mzo": "{zone} ah ruah a sur chhunzawm zel. {corridor} kawng dinhmun ngaihven hmasak a tha."
        }
    }
}

class NotificationService:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.broadcast_history: List[Dict[str, Any]] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocket] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WebSocket] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast_alert(self, alert_payload: Dict[str, Any]):
        """Broadcasts real-time alert payload to all connected WebSockets (Command Dashboards & Apps)."""
        self.broadcast_history.insert(0, alert_payload)
        dead_connections = []
        message_str = json.dumps(alert_payload)

        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"[WebSocket] Failed to send message: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    def generate_multilingual_alert(
        self,
        zone_code: str,
        zone_name: str,
        corridor_name: str,
        district: str,
        state: str,
        color_code: str,
        risk_score: float,
        top_factors: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a standardized, multi-lingual early warning alert packet
        with translations in English, Hindi, Assamese, Bengali, and Mizo.
        """
        color = color_code.upper()
        template = TRANSLATION_TEMPLATES.get(color, TRANSLATION_TEMPLATES["YELLOW"])
        
        ctx = {"zone": zone_name, "corridor": corridor_name or "Lifeline Highway"}

        titles = {lang: tmpl.format(**ctx) for lang, tmpl in template["title"].items()}
        messages = {lang: tmpl.format(**ctx) for lang, tmpl in template["message"].items()}

        alert_id = f"ALERT-{zone_code}-{int(datetime.now(timezone.utc).timestamp())}"

        # Simulated SMS payload (compact, <= 160 characters for GSM delivery)
        sms_text = f"[{color} ALERT] Landslide risk in {zone_name} ({corridor_name}): Score {risk_score:.0f}/100. Follow DDMA orders. Tollfree: 1077"

        return {
            "alert_id": alert_id,
            "zone_code": zone_code,
            "zone_name": zone_name,
            "corridor_name": corridor_name,
            "district": district,
            "state": state,
            "color_code": color,
            "risk_score": risk_score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "titles": titles,
            "messages": messages,
            "top_factors": top_factors or [],
            "dissemination_channels": {
                "websocket": True,
                "webpush": True,
                "sms_broadcast": {
                    "text": sms_text,
                    "target_subscribers_estimated": 12400
                },
                "siren_trigger": color == "RED"
            }
        }

notification_service = NotificationService()
