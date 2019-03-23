// Service Worker Initialization
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(() => {
    console.log("Service Worker Registerd");
  });
}

let dbPromise = idb.open("restaurants-store", 1, function(db) {
  if (!db.objectStoreNames.contains("restaurants")) {
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("reviews")) {
    const reviewsStore = db.createObjectStore("reviews", { keyPath: "id" });
    reviewsStore.createIndex("restaurant_reviews", "restaurant_id");
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("favorite-rests")) {
    db.createObjectStore("favorite-rests", { keyPath: "date" });
  }
});

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `/restaurants/`;
  }
  // static restaurants;
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(id, callback, useCache = false) {
    if (navigator.onLine && !useCache) {
      // IF online: get the date from API and update it
      fetch(DBHelper.DATABASE_URL + (id || ""))
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then(_restaurants_res => {
          const _restaurants = Array.isArray(_restaurants_res)
            ? _restaurants_res
            : [_restaurants_res];
          const restaurants = _restaurants.map(u => ({
            ...u,
            id: parseInt(u.id),
            photograph: `${u.photograph || u.id || "picture-not-available"}.jpg`
          }));
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            const store = tx.objectStore("restaurants");
            return Promise.all(
              restaurants.map(restaurant => store.put(restaurant))
            ).catch(() => {
              tx.abort();
              throw Error("Failed to update restaurants in IndexedDB");
            });
          });
          callback(null, restaurants);
        })
        .catch(err => {
          callback(err, null);
        });
    } else {
      // get it from indexedDB
      dbPromise
        .then(db => {
          const tx = db.transaction("restaurants", "readonly");
          const store = tx.objectStore("restaurants");
          return store.getAll();
        })
        .then(restaurants => {
          callback(null, restaurants);
        })
        .catch(err => {
          callback(err, null);
        });
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants(id, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id === id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants(
      null,
      (error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          const results = restaurants.filter(r => r.cuisine_type === cuisine);
          callback(null, results);
        }
      },
      true
    );
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants(null, (error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(
          r => r.neighborhood === neighborhood
        );
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants(
      null,
      (error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          let results = restaurants;
          if (cuisine !== "all") {
            // filter by cuisine
            results = results.filter(r => r.cuisine_type === cuisine);
          }
          if (neighborhood !== "all") {
            // filter by neighborhood
            results = results.filter(r => r.neighborhood === neighborhood);
          }
          callback(null, results);
        }
      },
      true
    );
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants(
      null,
      (error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          const neighborhoods = restaurants.map(
            (v, i) => restaurants[i].neighborhood
          );
          // Remove duplicates from neighborhoods
          const uniqueNeighborhoods = neighborhoods.filter(
            (v, i) => neighborhoods.indexOf(v) === i
          );
          callback(null, uniqueNeighborhoods);
        }
      },
      true
    );
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants(
      null,
      (error, restaurants) => {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          const cuisines = restaurants.map(
            (v, i) => restaurants[i].cuisine_type
          );
          // Remove duplicates from cuisines
          const uniqueCuisines = cuisines.filter(
            (v, i) => cuisines.indexOf(v) === i
          );
          callback(null, uniqueCuisines);
        }
      },
      true
    );
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    });
    marker.addTo(map);
    return marker;
  }

  // Related to Reviews
  static fetchReviews(id, callback) {
    if (navigator.onLine) {
      // IF online: get the date from API and update it
      fetch("/reviews/" + (id ? `?restaurant_id=${id}` : ""))
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then(reviews => {
          dbPromise.then(db => {
            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");
            return Promise.all(reviews.map(review => store.put(review))).catch(
              () => {
                tx.abort();
                throw Error("Failed to update reviews in IndexedDB");
              }
            );
          });
          callback(null, reviews);
        })
        .catch(err => {
          callback(err, null);
        });
    } else {
      // get it from indexedDB
      dbPromise
        .then(db => {
          const tx = db.transaction("reviews", "readonly");
          const store = tx.objectStore("reviews");
          return store.getAll();
        })
        .then(reviews => {
          callback(null, reviews);
        })
        .catch(err => {
          callback(err, null);
        });
    }
  }

  static fetchReviewsForRestaurantId(id, callback) {
    DBHelper.fetchReviews(id, (err, reviews) => {
      if (err) {
        callback(err, null);
        return;
      }
      const validReviews = reviews.filter(r => r.restaurant_id === id);
      callback(null, validReviews);
    });
  }

  static saveReviews(data, callback = () => {}) {
    if (navigator.onLine) {
      fetch("/reviews/", {
        method: "POST",
        body: JSON.stringify(data)
      })
        .then(res => res.json())
        .then(res => {
          return dbPromise.then(db => {
            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");
            store.put(res);
            return tx.complete;
          });
        })
        .then(() => {
          callback(null);
        })
        .catch(err => {
          callback(err);
        });
    } else {
      const review = {
        ...data,
        id: Date.now()
      };
      const toReview = dbPromise.then(db => {
        const tx = db.transaction("reviews", "readwrite");
        const store = tx.objectStore("reviews");
        return store.put(review);
        // return tx.complete;
      });

      const toSync = dbPromise.then(db => {
        const tx = db.transaction("sync-posts", "readwrite");
        const store = tx.objectStore("sync-posts");
        return store.put(review);
        // return tx.complete;
      });
      Promise.all([toReview, toSync])
        .then(data => {
          console.log(data);
          callback();
        })
        .catch(err => {
          callback(err);
        });
    }
  }

  static async syncPosts() {
    const db = await dbPromise;
    const tx = db.transaction("sync-posts", "readwrite");
    const store = tx.objectStore("sync-posts");
    const reviews = await store.getAll();
    await Promise.all(
      reviews.map(review => {
        return store.delete(review.id);
      })
    );
    reviews.forEach(review => {
      delete review.id;
      // const req = {};
      // for (const [k, v] of Object.entries()) {
      //   if (key !== "id") {
      //     req[k] = v;
      //   }
      // }
      DBHelper.saveReviews(review);
    });
  }

  static toggleFav(id, status) {
    if (!navigator.onLine) {
      let req = {};
      try {
        const reqStr = localStorage.getItem("fav-sync");
        if (reqStr) {
          req = JSON.parse(reqStr);
        }
      } catch (er) {}
      req = {
        ...req,
        [id]: status
      };
      localStorage.setItem("fav-sync", JSON.stringify(req));
      dbPromise.then(db => {
        const tx = db.transaction("restaurants", "readwrite");
        const store = tx.objectStore("restaurants");
        return store
          .get(id)
          .then(res => {
            return store.put({
              ...res,
              is_favorite: status ? "true" : "false"
            });
          })
          .then(() => {
            return tx.complete;
          });
      });
      return;
    }
    fetch(`restaurants/${id}/?is_favorite=${status ? "true" : "false"}`, {
      method: "PUT"
    })
      .then(res => res.json())
      .then(res => {
        return dbPromise.then(db => {
          const tx = db.transaction("restaurants", "readwrite");
          const store = tx.objectStore("restaurants");
          store.put(res);
          return tx.complete;
        });
      });
  }

  static syncFav() {
    let req = {};
    try {
      const reqStr = localStorage.getItem("fav-sync");
      if (reqStr) {
        req = JSON.parse(reqStr);
      }
    } catch (er) {}
    localStorage.removeItem("fav-sync");
    const pairs = Object.entries(req);
    if (!pairs.length) {
      return;
    }
    pairs.forEach(([id, status]) => {
      DBHelper.toggleFav(id, status);
    });
  }
}

window.addEventListener("online", async function() {
  await DBHelper.syncPosts();
  DBHelper.syncFav();
});
