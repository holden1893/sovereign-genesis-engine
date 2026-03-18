# NeuroForge Game Agency

A full-stack AI-powered game generation platform that creates complete 3D games from text specifications.

![NeuroForge Game Agency](https://ngbnh7qdrsbde.ok.kimi.link)

## Features

- **AI-Powered Game Design**: Uses OpenAI GPT-4 or Anthropic Claude to generate detailed game design documents
- **3D Asset Generation**: Procedurally generates 3D meshes, textures, and animations
- **Scene Composition**: Creates complete game levels with lighting, physics, and gameplay logic
- **Multi-Platform Export**: Supports PC, Console, Mobile, and Web platforms
- **Self-Evolution Training**: Continuously improves through self-play and quality metrics

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express
- **AI Models**: OpenAI GPT-4, Anthropic Claude, Stability AI
- **Total Parameters**: 133.6M (simulated neural architecture)

## Quick Start

### 1. Clone and Install

```bash
cd /mnt/okcomputer/output/app
npm install
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Required for AI game design generation
OPENAI_API_KEY=your_openai_api_key_here

# Optional - for AI texture generation
STABILITY_API_KEY=your_stability_api_key_here

# Optional - alternative to OpenAI
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API keys:
- [OpenAI](https://platform.openai.com/api-keys)
- [Stability AI](https://platform.stability.ai/)
- [Anthropic](https://console.anthropic.com/)

### 3. Run the Application

**Option A: Run both frontend and backend together**
```bash
npm start
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Status: http://localhost:3001/api/status

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Check API status and configuration |
| `/api/config` | GET | Get current API configuration (masked) |
| `/api/config` | POST | Update API keys |
| `/api/generate` | POST | Generate a new game |
| `/api/games` | GET | List all generated games |
| `/api/games/:id` | GET | Get game details |
| `/api/games/:id/download` | GET | Download game package |

## Game Generation Process

1. **Configure APIs**: Add your OpenAI/Anthropic API keys in the "API Config" section
2. **Set Specifications**: Choose genre, style, setting, platform, and complexity
3. **Generate**: Click "Generate Game" and wait for the AI to create:
   - Game design document (core mechanics, narrative, progression)
   - 3D assets (player, enemies, props, weapons)
   - Game scenes with lighting and physics
   - Gameplay logic (player controller, AI, UI)
4. **Download**: Export the complete game package as JSON

## Project Structure

```
├── src/
│   ├── sections/           # Page sections
│   │   ├── Hero.tsx        # Landing hero
│   │   ├── ApiConfig.tsx   # API key configuration
│   │   ├── SystemStatus.tsx # System metrics
│   │   ├── GameGenerator.tsx # Game generation form
│   │   ├── GameGallery.tsx  # Generated games gallery
│   │   ├── TrainingMetrics.tsx # Training dashboard
│   │   └── Navigation.tsx   # Top navigation
│   ├── types/
│   │   └── game.ts         # TypeScript types
│   └── App.tsx             # Main app component
├── server.js               # Backend API server
├── package.json
└── .env.example            # Environment variables template
```

## Generated Games Location

All generated games are stored in:
```
/generated_games/
├── {game_id}/
│   ├── game.json          # Complete game package
│   ├── assets/            # 3D models (OBJ format)
│   │   ├── player.obj
│   │   ├── enemy_0.obj
│   │   └── ...
│   └── scenes/            # Level files (JSON)
│       ├── level_01.json
│       └── ...
```

## Capabilities

### With OpenAI/Anthropic API:
- ✅ AI-generated game design documents
- ✅ Creative narratives tailored to genre/setting
- ✅ Detailed mechanics and progression systems
- ✅ Procedural 3D mesh generation
- ✅ Complete export packages

### Without AI APIs (Template Mode):
- ✅ Template-based game design
- ✅ Procedural 3D mesh generation
- ✅ All export functionality
- ⚠️ Less creative variety

### With Stability AI:
- ✅ AI-generated textures
- ✅ Style-consistent artwork

### Without Stability AI:
- ✅ Procedural texture generation
- ⚠️ Simpler textures

## Deployment

### Static Frontend (Current)
The frontend is deployed at: https://ngbnh7qdrsbde.ok.kimi.link

**Note**: To use the game generation features, you need to run the backend server locally:

```bash
cd /mnt/okcomputer/output/app
npm install
# Add your API keys to .env
npm run server
```

Then access the frontend and configure the API URL to point to your local backend.

### Full Deployment
For a complete deployment with backend:

1. Deploy the backend to a Node.js hosting service (Heroku, Railway, etc.)
2. Set environment variables for API keys
3. Update the frontend API URL
4. Deploy the frontend to a static hosting service

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Recommended | OpenAI API key for game design |
| `STABILITY_API_KEY` | Optional | Stability AI for textures |
| `ANTHROPIC_API_KEY` | Optional | Anthropic Claude alternative |
| `VITE_API_URL` | No | Frontend API URL (default: http://localhost:3001) |
| `PORT` | No | Backend server port (default: 3001) |

## License

MIT License - Feel free to use and modify as needed.

## Credits

- Built with React, TypeScript, Tailwind CSS, and shadcn/ui
- AI powered by OpenAI GPT-4, Anthropic Claude, and Stability AI
- Inspired by Google's Genie 3 and NeuroForge Engine
