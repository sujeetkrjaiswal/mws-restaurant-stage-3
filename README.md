# Running the project

```bash
npm install
npm start
```

Server will start at port `http://localhost:1337/`

## Chrome Audit Results

| Criteria            | Index Page | Restaurant-info Page |
| ------------------- | ---------- | -------------------- |
| Performance         | 99         | 99                   |
| Progressive web App | 92         | 92                   |
| Accessibility       | 94         | 94                   |
| Best Practises      | 93         | 93                   |

### Index Page Audit ScreenShot

![Screen shot for index page](./screenshots/index-page.png)

### Restaurant Info Audit Screenshot

![Screen shot for restaurant info page](./screenshots/restaurant-info.png)

## Project structuring

All the client side code is present in assets file. When the server starts all files from `assests` is moved to `.tmp\public` using gulp. All the assets have the gziped version, done using gulp.

Sails hosts files under `.tmp\public`.

### Client side changes

Updated files to use indexedDB using idb and localstorage to save local changes. `navigator.onLine` is used to detect if you are online or offline
