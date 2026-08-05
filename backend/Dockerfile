FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 HF_HOME=/app/model-cache PIP_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/
WORKDIR /app
RUN sed -i 's|deb.debian.org/debian|mirrors.aliyun.com/debian|g; s|security.debian.org/debian-security|mirrors.aliyun.com/debian-security|g' /etc/apt/sources.list.d/debian.sources && apt-get update && apt-get install -y --no-install-recommends libgomp1 curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --retries 3 --timeout 120 -r requirements.txt
COPY app ./app
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000","--workers","1"]
