<center>
<h1 style="color:orange">
 Rawen 
<img src="public/mainlogo.png" width="64" height="64" />
</h1>
<div style="display:flex;justify-content:center; ">
  <img src="https://i.ibb.co/8xmfNxD/Rawenio.png" width="400" height="400" />
</div>

### A desktop app that executes AI driven commands 
Create a copilot, combine different AI models and resources

<b> Work in progress 🚧 </b>

</center>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Overview](#overview)
- [Command execution - Basic Flow](#command-execution---basic-flow)
- [General Features](#general-features)
- [Dev-Mode](#dev-mode)
- [🛠️ Tools](#️-tools)
- [TY Technologies](#ty-technologies)
- [Disclaimer:](#disclaimer)


## Installation

[Downloaded the latest release](https://github.com/NexTechFusion/rawen/releases)


## Overview

<img src="https://i.ibb.co/Wx4wgKK/overview.png" width="550" height="270" />

Code and api servers will run on startup locally on the users machine. <br> <small>(TODO : Think about this) </small>

## Command execution - Basic Flow

<img src="https://i.ibb.co/ChWc3G7/flow.png" width="350" height="360" />

## General Features

- [x] **Local Knowledge management** - Manage local knowledge (Multimodal)
- [x] **Direct Document QA** - Ask questions about documents
- [x] **Summarization** - Summarize context / documents
- [x] **Visual QA** - QA images
- [x] **Command management** - Manage commands
- [x] **Shortcuts** - Create shortcuts for commands

## Dev-Mode

1. Clone the repository
2. Run `npm i --force`
3. Run `npm run dev`

At the menu "Key" set a default LLM and a key if needed.
**Ollama** is the default LLM, run it if not running https://ollama.com/

## 🛠️ Tools

- [SDK](https://github.com/NexTech-Fusion/Rawen-command-maker)
- [Documentation](https://docs.rawen.io/docs/About/origin)

## TY Technologies

- [Ollama](https://github.com/ollama)
- [Transformerjs](https://github.com/xenova/transformers.js)
- [LanceDB](https://github.com/lancedb/lancedb)
- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)

## Disclaimer:

Rawen is a highly experimental project to discover the potential of AI as a desktop copilot.
It should form a foundation for further research and development on our main objective.

The code is spaghetti but AI will fix this in the future.
