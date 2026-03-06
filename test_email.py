import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
import backend.email_service as es

es.EMAIL_MODE = "live"
es.RESEND_API_KEY = "re_DsNLWEBg_HhaD4Ts5wCVEDMRpk5ci9ZxG"

try:
    res = es._send(["parth@example.com"], "Test from ServiceMap", "<h1>Hello</h1>")
    print("Result:", res)
except Exception as e:
    print("Error:", e)
