class GoogleMapPlaces{

  constructor(self){
    this.service = null;
    this.distanceService = null;
    this.map = null;
    this.center = undefined;
    this.googleMapUnits = undefined;
    this.maxAttempts = 10;
    this.attemptsTimeout = 500;
    this.cache = {};
  }

  initService(map){
    if(!this.service){
      this.map = map;
      this.service = new google.maps.places.PlacesService(map);
      this.distanceService = new google.maps.DistanceMatrixService();
    }
  }

  getPlaces(catList, center, units){
    this.center = center;
    this.googleMapUnits = units;
    const promises = [];
    for (let category in catList){
      if(catList.hasOwnProperty(category)){
        let promise = undefined;
        if(this.cache.hasOwnProperty(category)){
          promise = Promise.resolve(this.cache[category]);
        } else {
          promise = this.nearBySearchPromise({
            location: center,
            rankBy: google.maps.places.RankBy.DISTANCE,
            type: [category],
            icon: catList[category]
          }).then(places => {
            return this.addDistancePromise(places);
          })
            .then(places => {
              this.cache[category] = places;
              return Promise.resolve(this.cache[category]);
            });
        }
        promises.push(promise);
      }
    }
    return Promise.all(promises).then((results) => {
      const fullList = GoogleMapPlaces.makeOneList(results); //method is STATIC! no THIS here
      return Promise.resolve(fullList);
    })
      .catch((error) => {
        console.log(error);
        alert("GoogleMapPlaces error: " + error);
      });
  }

  addDetailsPromise(places){
    const placesIdList = [];
    if(places.length === 0) return Promise.resolve([]);
    const promises = [];
    places.forEach((place, index) => {
      promises.push(
        this.getDetailsPromise(place.place_id, ['rating'])
      );
    });
    return Promise.all(promises)
      .then(results => {
        const all = this.addDetailsInfo(places, results);
        return Promise.resolve(all);
      });
  }

  addDetailsInfo(places, results){
    results.forEach((details,i) => {
      let rating = '-';
      if(details.rating){
        rating = details.rating;
      }
      places[i]['rating'] = rating
    });
    return places;
  }

  addDistancePromise(places){
    const destinations = [];
    if(places.length === 0) return Promise.resolve([]);
    places.forEach((place, index) => {
      destinations.push(place.geometry.location);
    });
    let units = google.maps.UnitSystem.METRIC;
    if (this.googleMapUnits === 'IMPERIAL') units = google.maps.UnitSystem.IMPERIAL;
    return this.getDistancePromise(this.center, destinations, 'DRIVING', units)
      .then(distanceInfo => {
        distanceInfo.rows[0].elements.forEach((d,i) => {
          places[i].distance = d;
          // console.log(JSON.stringify(d));
        });
        distanceInfo.destinationAddresses.forEach((a,i) => {
          places[i].address = a;
        });
        return Promise.resolve(places);
      });
  }

  static makeOneList(found){
    let list = {};
    for (let i = 0; i < found.length; i++) {
      for (let j = 0; j < found[i].length; j++) {
        const placeId =  found[i][j].place_id;
        list[placeId] = found[i][j];
      }
    }

    const out = [];
    for (var placeId in list) {
      if (list.hasOwnProperty(placeId)) {
        out.push(list[placeId]);
      }
    }
    return out;
  }

  getDistancePromise(origin, destinations, travelMode, unitSystem){
    const request = {
      origins: [origin],
      destinations: destinations,
      travelMode: travelMode,
      unitSystem: unitSystem
    };
    return new Promise((resolve, reject) => {
      this.distanceService.getDistanceMatrix(request, (distances, status) => {
        if(status === 'OK'){
          resolve(distances);
        } else {
          reject({
            status: status,
            dest: destinations
          });
        }
      });
    })
      .then((distances) => {
        return Promise.resolve(distances);
      })
      .catch((error) => {
        if (error.status === "OVER_QUERY_LIMIT"){
          if (this.maxAttempts > 0) {
            return new Promise((resolve, reject) => {
              setTimeout(()=> {
                resolve();
              }, this.attemptsTimeout);
            }).then(() => {
              // alert('start new attempt');
              return this.getDistancePromise(origin, destinations, travelMode, unitSystem);
            });
          } else {
            return Promise.reject(error);
          }
        } else {
          return Promise.reject(error);
        }
      });
  }

  getDetailsPromise(placeId, fields){
    const request = {
      placeId: placeId,
      fields: fields

    };
    return new Promise((resolve, reject) => {
      this.service.getDetails(request, (place, status) => {
        if(status === 'OK'){
          resolve(place);
        } else {
          reject({
            status: status,
            dest: place
          });
        }
      });
    })
      .then((place) => {
        return Promise.resolve(place);
      })
      .catch((error) => {
        if (error.status === "OVER_QUERY_LIMIT"){
          if (this.maxAttempts > 0) {
            return new Promise((resolve, reject) => {
              setTimeout(()=> {
                resolve();
              }, this.attemptsTimeout);
            }).then(() => {
              // alert('start new attempt');
              return this.getDetailsPromise(placeId, fields);
            });
          } else {
            return Promise.reject(error);
          }
        } else {
          return Promise.reject(error);
        }
      });
  }

  nearBySearchPromise(request){
    return new Promise((resolve, reject) => {
      this.service.nearbySearch(request, (places, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          if(status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          }
          reject(status);
        }
        for (let i = 0, place; place = places[i]; i++) {
          places[i].icon = request.icon;
          places[i].distance = 'no data';
          // places[i].marker = this.createMarker(i, place);
        }
        resolve(places);
      });
    }).then((result) => {
      return Promise.resolve(result);
    }).catch((status) => {
      if(status === "OVER_QUERY_LIMIT") {
        //alert('Need to make setTimeout()');
        if (this.maxAttempts > 0) {
          return new Promise((resolve, reject) => {
            setTimeout(()=> {
              resolve();
            }, this.attemptsTimeout);
          }).then(() => {
            // alert('start new attempt');
            return this.nearBySearchPromise(request)
          });

        } else {
          return Promise.reject(status);
        }
      } else {
        return Promise.reject(status);
      }
    });
  };
}
// console.log("GoogleMapPlaces.js started");
