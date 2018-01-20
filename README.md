> __Important__: This project is being improved and converted into typescript. See repository [jmulet/piworld-ts-server](https://github.com/jmulet/piworld-ts-server)

# ![logo](/screenshots/logo.png) piWorld.es 

Main repository for the project piworld.es

### About
πWorld is a learning platform for interactive mathematics and other scientific subjects. It has been, in part, inspired by ExerMath, Khan Academy, Matematico.es, Educanon, Kahoot among others.

# Installation
1. Install latest node and npm.
2. Install bower `brew install bower`
3. Install mysql5.x. Import database file `piworld_blank.sql`. Create a user with enough privilegies to remotely connect this database.
4. Dowload or clone this repository to your computer.
5. `cd piworld`
6. Install server dependencies `npm install`
7. `cd public`
8. Install client dependencies `bower install`

# Build
1. Go back the the root directory: piworld/
2. Execute `npm run-script compile`

# Configure
1. Rename the file server/server-config.js to server/server.config.js and edit your site configuration there.

# Run
1. Run the server `node server.js`
2. Open a browser window and navigate to `localhost:3000`

# Extra Modules
- [PDA4](https://github.com/jmulet/pda4): PDA web for piworld.es. Just copy the dist/ folder of this repository into public/pda directory of the current repository.

# Screenshots
![Login page](/screenshots/login.png)

![Teacher homepage](/screenshots/teacherhome.png)
