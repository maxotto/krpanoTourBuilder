//todo https://github.com/paulirish/matchMedia.js
//todo https://www.w3schools.com/jsref/met_win_matchmedia.asp
class GoogleMapApp {
    constructor(){
        this.ready = false;
        this.center = {
            lat: 43.762976,
            lng: -79.372175
        };
        this.map = undefined;
        this.vm = undefined;
        this.placesLib = new GoogleMapPlaces();
        this.useFixedZoom = 15;
    }


    createApp() {
        if (!this.ready) {
            const self = this;
            const appDiv = document.getElementById('vueAppContainer');
            appDiv.innerHTML = httpGet('ext/gmap/vueApp.html');
            Vue.component('google-map', VueGoogleMaps.Map);
            Vue.component('google-marker', VueGoogleMaps.Marker);
            this.vm = new Vue ({
                el: '#googleApp',
                data: {
                  center: self.center,
                  zoom: 5,
                  centerIcon: {
                      url: 'skin/vtourskin_mapspotactive.png',
                      size: {width: 40, height: 46, f: 'px', b: 'px'},
                      scaledSize: {width: 40, height: 46, f: 'px', b: 'px'}
                  },
                  dialog: false,
                  xs_dialog: false,
                  searchRules: {
                    'school': {name: 'Школы', cat:['school'], icon: 'school.png'},
                    'eat-drink': {name: 'Покушать', cat:['restaurant', 'cafe', 'bar', 'meal_delivery'], icon: 'fastfood.png'},
                    'entertainment': {name: 'Развлечься', cat:['casino', 'gym', 'stadium', 'movie_theater', 'travel_agency'], icon: 'stadium.png'},
                    'stores': {name: 'Купить', cat:['clothing_store', 'bakery', 'convenience_store', 'department_store', 'electronics_store', 'hardware_store', 'store',], icon: 'mall.png'},
                  },
                  categories: [
                    {id: 'school', cat:['school'], text: "Школы", icon: 'static/img/gmap/school.png'},
                    {id: 'eat-drink', cat:['restaurant', 'cafe', 'bar', 'meal_delivery'], text: "Покушать", icon: 'static/img/gmap/fastfood.png'},
                    {id: 'entertainment', cat:['casino', 'gym', 'stadium', 'movie_theater', 'travel_agency'], text: "Развлечься", icon: 'static/img/gmap/stadium.png'},
                    {id: 'stores', cat:['clothing_store', 'bakery', 'convenience_store', 'department_store', 'electronics_store', 'hardware_store', 'store',], text: "Купить", icon: 'static/img/gmap/mall.png'},
                  ],
                  valuesToSearch: [],
                  showTableButton: false,
                  showTableButtonSelected: '',
                  showTableButtonLeft: 320,
                  showTable: false,

                  notFound: false,
                  tableHeight: 330,
                  tableWidth: 330,
                  placesList: {
                      search: '',
                      headersSmallScreen: [
                          {
                              text: 'Name',
                              align: 'center',
                              sortable: false,
                              value: 'name',
                          }
                      ],
                      headers: [
                          {
                              text: 'Name',
                              align: 'center',
                              sortable: false,
                              value: 'name',
                          },
                          {
                              text: 'Distance',
                              value: 'distanceValue',
                              sortable: true,
                              align: 'center',
                          },
                          {
                              text: 'Rating',
                              value: 'rating',
                              sortable: true,
                              align: 'center',
                          }
                      ],
                      places: [],
                      loading: false
                  },
                  placeObjects: [],
                  markers: [],
                  mapOptions: {
                    gestureHandling: 'greedy',
                    mapTypeControl: false,
                  },
                  infoWindowPos: null,
                  infoWinOpen: false,
                  infoContent: '',
                  currentInfoWindowIdx: -1,
                  infoOptions: {
                      pixelOffset: {
                          width: 0,
                          height: -35
                      }
                  },
                },
                watch: {
                  valuesToSearch (currentList, oldList){
                    this.showTableButton = (currentList.length !==0 );
                    if(currentList.length === 0){
                      this.showTable = false;
                      this.showTableButtonSelected = null;
                    }
                    this.runSearch();
                  },
                  showTableButtonSelected(active){
                    this.showTable = (active === 0);
                  },
                  showTable(val){
                    if (val) this.onTableParentResize();
                  }
                },
                mounted(){
                    this.$refs.mapRef.$mapPromise.then((map) => {
                        self.map = map;
                        self.placesLib.initService(self.map);
                    });
                    this.onTableParentResize();
                },
                methods: {
                  onTableParentResize(){
                    const parentSize =this.getSizeById('googleApp');
                    this.tableHeight = parentSize.height - 37;
                    const selectBlockSize = this.getSizeById('select-panel');
                    this.showTableButtonLeft = selectBlockSize.width;
                    const showTableButtonSize = this.getSizeById('show-table-button');
                    this.tableWidth = selectBlockSize.width+showTableButtonSize.width -5;
                  },
                  getHeightById(elmID) {
                    const size = this.getSizeById(elmID);
                    return (size.height);
                  },
                  getSizeById(elmID){
                    var elmPadding, elmHeight, elmWidth, elmMargin, elm = document.getElementById(elmID);
                    const out = {
                      height: 0,
                      width: 0
                    };

                    elmHeight = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('height'));
                    elmMargin = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-top')) + parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-bottom'));
                    elmPadding = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('padding-top')) + parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('padding-bottom'));
                    out.height = elmHeight + elmMargin + elmPadding;

                    elmWidth = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('width'));
                    elmMargin = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-left'))
                      + parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-right'));
                    elmPadding = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('padding-left'))
                      + parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('padding-right'));
                    out.width = elmWidth + elmMargin + elmPadding;

                    return out;

                  },
                  runSearch(){
                      self.findPlaces();
                  },
                  openApp(config){
                    this.mapOptions.mapTypeControl = true;
                    this.mapOptions.fullscreenControl = false;
                    this.mapOptions.mapTypeControlOptions = {
                      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                      position: google.maps.ControlPosition.TOP_CENTER
                    };
                    this.dialog = true;
                    self.center.lat = config.lat;
                    self.center.lng = config.lng;
                    this.center = self.center;
                    self.useFixedZoom = config.useFixedZoom;
                    this.useFixedZoom = self.useFixedZoom;
                    if(this.useFixedZoom !== false){
                      this.zoom = this.useFixedZoom;
                    } else {
                      this.zoom = config.iniZoom;
                    }
                    self.language = config.language;
                    self.googleMapUnits = config.googleMapUnits;
                    self.findPlaces();
                  },
                  showBalloon(markerIndex){
                    if ( markerIndex === this.currentInfoWindowIdx ){
                        this.infoWinOpen = !this.infoWinOpen;
                    } else {
                      this.currentInfoWindowIdx = markerIndex;
                      const marker = this.markers[markerIndex];
                      const place = this.placeObjects[markerIndex];
                      const listItem = this.placesList.places[markerIndex];
                      this.infoContent = "<div style=\"color: #1e88e5\">" +
                        "<h3>" + place.name + "</h3>" +
                        "<span style='color: #0000b6'><u><b>Address:</b></u> " + place.address + "</span><br>" +
                        "<span style='color: mediumblue'><u><b>Distance/time:</b></u> " + listItem.distanceText + "</span><br>" +
                        "<span style='color: mediumblue'><u><b>Rating:</b></u> " + listItem.rating + "</span>";
                      this.infoWindowPos = marker.position;
                      this.infoWinOpen = true;
                      const bounds = new google.maps.LatLngBounds();
                      bounds.extend(self.center);
                      bounds.extend(place.geometry.location);
                      self.map.fitBounds(bounds);
                      self.map.setZoom(self.map.getZoom()-1);
                    }
                  }
                },
            });
            this.ready = true;
        }
    }

    findPlaces() {
      this.vm.placesList.loading = true;
      const searchCriteria = {};
      this.vm.valuesToSearch.forEach((set) => {
        this.vm.searchRules[set]['cat'].forEach((category) => {
          searchCriteria[category] = this.vm.searchRules[set]['icon'];
        });
      });
      var promise = this.placesLib.getPlaces(searchCriteria, this.center, this.googleMapUnits);
        promise.then(
            results => {
              this.clearPlaces();
              this.vm.placesList.places = [];
              this.vm.placeObjects = [];
              this.vm.onTableParentResize();
              if (results.length === 0){
              } else {
                this.createMarkers(results);
                this.updateList(results);
              }
              this.vm.placesList.loading = false;
            },
            error => alert("Ошибка: " + error.message) // Ошибка: Not Found
        );
    }

    updateList(places){
        for (let i = 0, place; place = places[i]; i++) {
            this.vm.placesList.places.push({
                value: false,
                distanceValue: place.distance.distance.value,
                distanceText: place.distance.distance.text + ', ' + place.distance.duration.text,
                name: place.name,
                rating: place.rating,
                markerIndex: i,
            });
            this.vm.placeObjects.push(place);
        }
    }

    clearPlaces(){
        this.vm.infoWinOpen=false;
        for (let i = 0; i < this.vm.markers.length; i++) {
            this.vm.markers[i].setMap(null);
        }
        this.vm.markers = [];
    }

    createMarkers(places){
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(this.center);
        let count = 0;
        for (let i = 0, place; place = places[i]; i++) {
            count++;
            const marker = new google.maps.Marker({
                map: this.map,
                icon: 'ext/gmap/img/' + place.icon,
                title: place.name,
                position: place.geometry.location,
                markerIndex: i,
            });
            marker.addListener('click', () => {
                this.onMarkerClick(marker);
            });
            this.vm.markers.push(marker);
            bounds.extend(place.geometry.location);
        }
        if(this.useFixedZoom === false){
          this.map.fitBounds(bounds);
        }
        if(count <3 ) this.map.setZoom(this.map.getZoom()-1);
    }

    onMarkerClick(marker){
        this.vm.showBalloon(marker.markerIndex);
    }
}

function httpGetAsync(theUrl, callback)
{
    const XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
    const xmlHttp = new XHR();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function httpGet(theUrl)
{
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

console.log("vueApp.js started");
Vue.use(VueGoogleMaps, {
    load: {
        key: 'AIzaSyARIMiX_C7rE4U-pM6nih2n2z2z0YfhrfY',
        libraries: 'places', // This is required if you use the Autocomplete plugin
        // OR: libraries: 'places,drawing'
        // OR: libraries: 'places,drawing,visualization'
        // (as you require)

        //// If you want to set the version, you can do so:
        // v: '3.26',
    },
    //// If you intend to programmatically custom event listener code
    //// (e.g. `this.$refs.gmap.$on('zoom_changed', someFunc)`)
    //// instead of going through Vue templates (e.g. `<GmapMap @zoom_changed="someFunc">`)
    //// you might need to turn this on.
    // autobindAllEvents: false,

    //// If you want to manually install components, e.g.
    //// import {GmapMarker} from 'vue2-google-maps/src/components/marker'
    //// Vue.component('GmapMarker', GmapMarker)
    //// then disable the following:
    // installComponents: true,
});
var googleMap = new GoogleMapApp();
googleMap.createApp();


