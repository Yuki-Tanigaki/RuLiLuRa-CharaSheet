# RuLiLuRa-CharaSheet

# 準備
WSL で以下：
```
sudo apt update
sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

一度ターミナルを開き直してから：
```
nvm install 22
nvm use 22
node -v
npm -v
```

# Vite + Reactでレポジトリ作成
```
npm create vite@latest . -- --template react
npm install
npm install lz-string
```

# ローカルで起動
```
npm run dev
```
