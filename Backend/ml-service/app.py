from datetime import datetime, timezone
from flask import Flask, jsonify
from flask_cors import CORS
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from llm_client import check_local_llm
from llm_routes import llm_routes

# Load environment variables from the workspace-level environment folder.
load_dotenv(Path(__file__).resolve().parents[2] / "env" / "ml-service.env")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

app = Flask(__name__)
CORS(app)
app.register_blueprint(llm_routes)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "UP",
        "service": "CareerOS ML Service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200

if __name__ == '__main__':
    if os.getenv("LLM_PROVIDER", "gemini").lower() == "local":
        check_local_llm()
    port = int(os.getenv("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
