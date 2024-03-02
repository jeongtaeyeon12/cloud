#!/bin/bash

# 쿠버네티스 디플로이먼트 및 서비스 생성을 위한 YAML 파일 생성
cat <<EOF >deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $containername
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $containername
  template:
    metadata:
      labels:
        app: $containername
    spec:
      containers:
      - name: novnc-container
        image: fredblgr/ubuntu-novnc:20.04
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: $containername
spec:
  type: NodePort
  selector:
    app: $containername
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: $containerPort
EOF
