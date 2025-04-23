<div align="center">
<h1 align="center">Paulov's Tarkov NodeJs Api</h1>

  <p align="center">
	A personal project to learn NodeJs Express Api against a real-world game example.
  </p>

</div>

## About the Project
This is a personal project to learn NodeJs Express Api & Website against a real-world game example. In this case Escape from Tarkov server side endpoints.

## The project ruleset
- I have gone against the new normal of using TypeScript and stuck with simple JavaScript throughout
- Learn and use Express
- Attempt to use the Model-View-Controller design within NodeJs
- Use Swagger Open Api
- Use username/password authorization
- Use web token authorization - NOT YET IMPLEMENTED
- Create a NodeJs that will work in the free Azure Web Service. 
  - The free tier of the Azure Web Service has a very low memory size threshold and very low hard disk space threshold. If you exceed the threshold, the app will not start or crash. 
  - The main aim is to keep the footprint very low 
  - Do not load anything permanently into memory
  - Do not have large loose files in the project
  
## Current running live example Website and Api
- [Dev-Test](https://paulovtarkovnodejsapi-dev.azurewebsites.net/)
- [Production](https://paulovtarkovnodejsapi.azurewebsites.net/)
- [Hardcore](https://paulovtarkovnodejsapi-hc.azurewebsites.net/) - Not live
- [Zombies](https://paulovtarkovnodejsapi-zombies.azurewebsites.net/) - Not live
- [Swagger Api UI](https://paulovtarkovnodejsapi-dev.azurewebsites.net/api-docs)
- [Ammo Table - including custom rating calculation](https://paulovtarkovnodejsapi-dev.azurewebsites.net/ammo)
- [Item Table - including custom rating calculation](https://paulovtarkovnodejsapi-dev.azurewebsites.net/items)
  
## Installation

### Requirements

This project has been built in [Visual Studio Code](https://code.visualstudio.com/) using [Node.js](https://nodejs.org/).

### Initial Setup

For development you will need to:

1. Clone the repository: `git clone https://github.com/paulov-t/Paulov.Tarkov.NodeJsApi.git`
2. Get Large File System files: `git lfs pull`
3. Open `PaulovWebServer.code-workspace` in Visual Studio Code.
4. Run `npm install` in Visual Studio Code Terminal.
5. Press F5 and select Node.js

## License

- This project is licensed under the Attribution-NonCommercial-NoDerivatives 4.0 International License. See [LICENSE](LICENSE.md)
- This project uses SP-Tarkov's Database. SP-Tarkov is licensed under NCSA Open Source. [LICENSE](https://github.com/sp-tarkov/server/blob/master/LICENSE.md)

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/paulov-t/Paulov.Tarkov.NodeJsApi.svg?style=for-the-badge

[forks-shield]: https://img.shields.io/github/forks/paulov-t/Paulov.Tarkov.NodeJsApi.svg?style=for-the-badge&color=%234c1

[forks-url]: https://github.com/paulov-t/Paulov.Tarkov.NodeJsApi/network/members

[stars-shield]: https://img.shields.io/github/stars/paulov-t/Paulov.Tarkov.NodeJsApi?style=for-the-badge&color=%234c1

[stars-url]: https://github.com/paulov-t/Paulov.Tarkov.NodeJsApi/stargazers

[downloads-total-shield]: https://img.shields.io/github/downloads/paulov-t/Paulov.Tarkov.NodeJsApi/total?style=for-the-badge

[downloads-latest-shield]: https://img.shields.io/github/downloads/paulov-t/Paulov.Tarkov.NodeJsApi/latest/total?style=for-the-badge
