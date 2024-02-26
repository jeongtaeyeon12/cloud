# 기반이 될 이미지 선택
FROM node:20.10.0

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 앱 실행
CMD ["npm", "start"]
