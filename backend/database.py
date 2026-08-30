import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from config import DB_PATH

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        media_type TEXT NOT NULL,
        media_path TEXT NOT NULL,
        scene_type TEXT NOT NULL,
        scene_confidence TEXT NOT NULL,
        sub_category TEXT,
        overall_status TEXT NOT NULL,
        findings_count INTEGER DEFAULT 0,
        executive_summary TEXT,
        analysis_plan TEXT,
        findings_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS finding_actions (
        finding_id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        action_status TEXT NOT NULL,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analyses (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS video_timelines (
        analysis_id TEXT PRIMARY KEY,
        total_duration REAL,
        frame_interval REAL,
        keyframes_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analyses (id)
    )
    """)
    conn.commit()
    conn.close()

def save_analysis(analysis_data: Dict[str, Any], media_path: str, media_type: str = "image"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    scene = analysis_data.get("scene", {})
    findings = analysis_data.get("findings", [])
    
    cursor.execute("""
    INSERT OR REPLACE INTO analyses (
        id, filename, media_type, media_path, scene_type, scene_confidence,
        sub_category, overall_status, findings_count, executive_summary,
        analysis_plan, findings_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_data.get("id"),
        analysis_data.get("filename", Path(media_path).name),
        media_type,
        media_path,
        scene.get("type", "general"),
        scene.get("confidence", "high"),
        scene.get("sub_category", ""),
        analysis_data.get("overall_status", "normal"),
        len(findings),
        analysis_data.get("executive_summary", ""),
        json.dumps(analysis_data.get("analysis_plan", [])),
        json.dumps([f.model_dump() if hasattr(f, "model_dump") else f for f in findings])
    ))
    conn.commit()
    conn.close()

def get_all_analyses() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, filename, media_type, media_path, scene_type, scene_confidence,
           sub_category, overall_status, findings_count, executive_summary, created_at
    FROM analyses
    ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    data = dict(row)
    data["analysis_plan"] = json.loads(data["analysis_plan"]) if data.get("analysis_plan") else []
    findings = json.loads(data["findings_json"]) if data.get("findings_json") else []
    
    # Merge any persisted finding actions
    cursor.execute("SELECT finding_id, action_status, notes FROM finding_actions WHERE analysis_id = ?", (analysis_id,))
    actions = {r["finding_id"]: (r["action_status"], r["notes"]) for r in cursor.fetchall()}
    
    for f in findings:
        fid = f.get("id")
        if fid in actions:
            f["action_status"] = actions[fid][0]
            f["action_notes"] = actions[fid][1]
            
    data["findings"] = findings
    
    # Check for video timeline
    cursor.execute("SELECT * FROM video_timelines WHERE analysis_id = ?", (analysis_id,))
    timeline_row = cursor.fetchone()
    if timeline_row:
        data["video_timeline"] = {
            "total_duration": timeline_row["total_duration"],
            "frame_interval": timeline_row["frame_interval"],
            "keyframes": json.loads(timeline_row["keyframes_json"])
        }
        
    conn.close()
    return data

def update_finding_action(finding_id: str, analysis_id: str, action_status: str, notes: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO finding_actions (finding_id, analysis_id, action_status, notes)
    VALUES (?, ?, ?, ?)
    """, (finding_id, analysis_id, action_status, notes or ""))
    conn.commit()
    conn.close()

# Initialize tables on load
init_db()
