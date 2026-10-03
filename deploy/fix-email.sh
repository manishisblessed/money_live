#!/bin/bash
cd /home/ubuntu/emoney
sed -i 's|EMAIL_FROM="onboarding@resend.dev"|EMAIL_FROM="noreply@nxtgpay.com"|' .env
grep EMAIL_FROM .env
