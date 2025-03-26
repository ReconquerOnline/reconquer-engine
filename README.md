![alt text](https://github.com/ReconquerOnline/reconquer-engine/blob/master/header.png?raw=true)

🚨 **IMPORTANT:** Before using or contributing, please read the [LICENSE](LICENSE) and [CONTRIBUTOR LICENSE AGREEMENT](CONTRIBUTOR_LICENSE_AGREEMENT.md).

## Overview

Reconquer Engine is an MMORPG game engine and framework for creating games with mechanics similiar to Old School Runescape (OSRS). It is currently used for the game [Reconquer Online](https://news.reconquer.online/). This repository contains not only the engine files, but also all the assets for running a local copy of Reconquer Online!

It uses native web technology for user interfaces and **three.js** for graphics. Therefore it can easily run in a web browser or an Electron app. The backend uses **Express** and **Socket.io** for a server and real time communication. The exporter, which combines game assets and generates configs, uses **gltf-transform**.

This version uses a simple local-file database and simple authentication system that should generally be replaced in production deployments.

## Architecture

1. **Assets**: Contains all game assets.
2. **Exporter**: Processes and optimizes assets.
3. **Client**: Contains browser client code, compiled using vite.
4. **Server**: Node.js server using express and socket.io.

### How It Looks:
```mermaid
graph LR
    A[Assets] --> B[Exporter]
    B --> C[Client]
    B --> D[Server]
```

## Prerequisites

* Use node.js version 20 or higher (check with `node --version`) using [nvm](https://github.com/nvm-sh/nvm).

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ReconquerOnline/reconquer-engine.git
   cd reconquer-engine
   ```
2. **Install dependencies:**
   ```bash
   npm install  # Install dependencies in the root directory
   cd exporter
   npm install  # Install dependencies in the exporter directory
   ```
3. **Run the exporter script:**
   ```bash
   npm start  # Run this inside the exporter directory
   ```
4. **Start the development environment:**
   ```bash
   cd ..  # Move back to the root directory
   npm run build  # Start build client files (Can also run "npm run watch" in a separate terminal)
   npm start dev  # Start the development server
   ```
5. **Access the application:**

Open your web browser and navigate to http://localhost:3000 to view the application. To login with multiple accounts, run them in different profiles in Chrome.

## Contributing

We welcome contributions for the engine itself and for Reconquer Online! Before submitting a pull request, please:

- Agree to the Contributor License Agreement ([Contributor License Agreement](CONTRIBUTOR_LICENSE_AGREEMENT.md)).

## License

Reconquer Engine is licensed under a custom license similar in principle to the one Unreal Engine uses. Commercial users who gross more than $100,000 USD per year are subject to a 5% royalty. See the [LICENSE](LICENSE.md) file for details.

## Community & Support

- 📢 **Discord**: [Join our community](https://discord.gg/5VqPUfdMn9)
- 🛠 **Report Issues**: [GitHub Issues](https://github.com/ReconquerOnline/reconquer-engine/issues)
- 🌱 **Feature Requests**: Submit ideas in the Discord channel.

🚀 **Happy building!**
