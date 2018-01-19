# ![logo](/screenshots/logo.png) piWorld.es 

Main repository for the project piworld.es

### About
πWorld is a learning project for interactive mathematics and other scientific subjects. It has been, in part, inspired by ExerMath, Khan Academy, Matematico.es, Educanon, Kahoot

# Installation
1. Install latest node and npm.
2. Install mysql5.x. Import database file imaths_blank.sql. Create a user with enough privilegies to remotely connect this database.
3. Dowload or clone this repository to your computer.
4. `cd piworld`
5. Install dependencies `npm install`

# Build
1. Execute `npm run-script compile`

# Configure
1. Rename the file server/server-config.js to server/server.config.js and edit your site configuration there.

# Run
1. Run the server `node server.js`

# Extra Modules
- [PDA4](https://github.com/jmulet/pda4): PDA web for piworld.es. Just copy the dist/ folder of this repository into public/pda directory of the current repository.

# Screenshots
![Login page](/screenshots/login.png)

![Teacher homepage](/screenshots/teacherhome.png)
