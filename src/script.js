'use strict'

const formInsert = document.querySelector('.form__insert')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__insert .form__input--type')
const inputDistance = document.querySelector('.form__insert .form__input--distance')
const inputDuration = document.querySelector('.form__insert .form__input--duration')
const inputCadence = document.querySelector('.form__insert .form__input--cadence')
const inputElevation = document.querySelector('.form__insert .form__input--elevation')
  // <---------------------form edit selector-------------------->//
const formEdit = document.querySelector('.form__edit')
// const editType = document.querySelector('.form__edit .form__input--type')
const editDistance = document.querySelector('.form__edit .form__input--distance')
const editDuration = document.querySelector('.form__edit .form__input--duration')
const editCadence = document.querySelector('.form__edit .form__input--cadence')
const editElevation = document.querySelector('.form__edit .form__input--elevation')

class App {
  #map
  #mapEvent
  #mapZoom =13
  #workouts=[]
  constructor () {
    this._getPosition()
    this._getStorage()
    formInsert.addEventListener('submit', this._newWorkout.bind(this))
    // formEdit.addEventListener('submit',this.editWorkout.bind(this))
    inputType.addEventListener('change', this._toggleElevation)
    containerWorkouts.addEventListener('click',this._movePopup.bind(this))
    // containerWorkouts.addEventListener('click',this._editWorkout.bind(this))
    
    

  }
  _getPosition () {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
        () => {
          alert('could not fetch current position')
        })
  }
  _loadMap (position) {
    const {latitude} = position.coords
    const { longitude } = position.coords
    const coord = [latitude, longitude]
     this.#map = L.map('map').setView(coord, this.#mapZoom)

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map)

    this.#map.on('click', this._showForm.bind(this))
    this._setStorage()
     this.#workouts.forEach(work => {
      this._renderMarker(work)
    })
  }
  _showForm(mapE) {
    // console.log('message')
    this.#mapEvent=mapE
    formInsert.classList.remove('hidden')
    inputDistance.focus()
  }
  _hideForm() {
    formInsert.reset()
    formInsert.style.display='none'
    formInsert.classList.add('hidden')
    setTimeout(() => formInsert.style.display='grid', 1000);
  }
  _toggleElevation() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
   }
  
  _newWorkout (e) {
    e.preventDefault()
    const type = inputType.value
    const distance = +inputDistance.value
    const cadence = +inputCadence.value
    const duration = +inputDuration.value
    const elevation = +inputElevation.value
    const isValid = (...inputs) => inputs.every(inp => Number.isFinite(inp))
    const isPositive = (...inputs) => inputs.every(inp => inp > 0)
    let workout
    const {lat,lng}=this.#mapEvent.latlng

    if (type === 'running') {
      if (!isValid(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence))
        return alert('enter positive numbers only')
      workout = new Running([lat,lng], distance, duration, cadence) 
      
    }

    if (type === 'cycling') {
      if (!isValid(distance, duration, elevation) ||
        !isPositive(distance, duration))
        return alert('enter positive numbers only')
       workout=new Cycling([lat,lng],distance,duration,elevation)      
    }
    
    this.#workouts.push(workout)
    // console.log(this.#workouts)
    this._renderMarker(workout)
    this._renderWorkout(workout)
    if (type === 'cycling') 
      this._toggleElevation()
    this._hideForm()
    this._setStorage()


  }
  _renderWorkout(workout) { 

    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.desc}</h2>
          <div class="workout__details">
            <span class="workout__icon">
            ${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'} </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
      
     
    }
     if (workout.type === 'cycling') {
        html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
      }
    formEdit.insertAdjacentHTML('afterend',html)
  }
  _renderMarker(workout) {  
    // const { lat, lng } = this.#mapEvent.latlng
      L.marker(workout.coord).addTo(this.#map)
        .bindPopup(L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`
        })
          .setContent(`${workout.desc}`)
      )
        .openPopup()
   
  }
  _setStorage() {
    localStorage.setItem('workouts',JSON.stringify(this.#workouts))
  }
  _getStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'))
    if (!data) return
    this.#workouts = data
    this.#workouts.forEach(work => {
      this._renderWorkout(work)
    })
    
  }
  reset() {
    localStorage.removeItem('workouts')
    location.reload()
  }
  _movePopup(e) {
    const workoutEl = e.target.closest('.workout')
    if (!workoutEl) return
    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)
    // console.log(workout)
    this.#map.setView(workout.coord, this.#mapZoom)
  }
  // _editWorkout(e) {
  //   form.classList.remove('hidden')
  //   let distance = inputDistance.value
  //   const workoutEl = e.target.closest('.workout')
  //   if (!workoutEl) return
  //   const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)
  //   distance =100
  // }
}
const app = new App()


const months= ["January","February","March","April","May","June","July",
            "August","September","October","November","December"];
class Workout{
  date = new Date()
  id=(Date.now()+'').slice(-10)
  constructor(coord,distance,duration) {
    this.coord = coord
    this.distance = distance
    this.duration = duration
    
    
  }
  _setDesc() {
   
    this.desc = `${this.type[0].toUpperCase()+this.type.slice(1)} on ${months[this.date.getMonth()]
      } ${this.date.getDate()}`
    return this.desc
  }
}
class Running extends Workout{
  type='running'
  constructor(coord, distance, duration, cadence) {
    super(coord, distance, duration)
    this.cadence = cadence
    this.pace = this._calcPace()
    this.desc = this._setDesc()
    
  }
  _calcPace() {
    this.pace = this.duration / this.distance
    return this.pace
  }
  
} class Cycling extends Workout{
  type = 'cycling'
  constructor(coord, distance, duration, elevation) {
    super(coord, distance, duration)
    this.elevation = elevation
    this.speed = this._calcSpeed()
    this.desc = this._setDesc()
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60)
    return this.speed
  }
  
}
// const test = new Running([39, 5], 3, 4, 5)
// console.log(test)