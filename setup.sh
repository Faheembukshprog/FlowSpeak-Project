#!/bin/bash
echo "Starting FlowSpeak Cross-Platform Setup..."

echo "1. Restoring Backend Dependencies..."
cd src/FlowSpeak.Api || exit
dotnet restore
dotnet tool install --global dotnet-ef 2>/dev/null || true
dotnet ef database update
cd ../..

echo "2. Restoring Frontend Dependencies..."
cd flowspeak-ui || exit
npm install
cd ..

echo "Setup Complete!"
