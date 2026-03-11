#!/usr/bin/env python3
"""마이크 테스트 데이터 수집 서버 — index.html 서빙 + POST /mic-test 엔드포인트"""

import json, os, http.server, datetime

PORT = 8765
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mic_data")
os.makedirs(DATA_DIR, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_POST(self):
        if self.path == "/mic-test":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error":"invalid json"}')
                return

            # 타임스탬프 파일명
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(DATA_DIR, f"mic_test_{ts}.json")
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            # 최신 결과를 latest.json으로도 저장
            latest = os.path.join(DATA_DIR, "latest.json")
            with open(latest, "w") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"[저장] {filepath} ({len(data.get('samples', []))} samples)")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "file": filepath}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


if __name__ == "__main__":
    with http.server.HTTPServer(("0.0.0.0", PORT), Handler) as srv:
        print(f"서버 시작: http://localhost:{PORT}")
        print(f"데이터 저장 위치: {DATA_DIR}/")
        srv.serve_forever()
