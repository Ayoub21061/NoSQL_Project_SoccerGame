
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY Deployment/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY Backend ./Backend
COPY Deployment ./Deployment



EXPOSE 5001

CMD ["python", "Backend/main.py"]
