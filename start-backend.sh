#!/bin/bash
export PATH="/nix/store/bjzmfa360s8f3n4xqlnkamy13fkywb2x-dotnet-sdk-10.0.101/bin:$PATH"
cd src/FlowSpeak.Api
exec dotnet run --no-build --urls='http://localhost:3001'
