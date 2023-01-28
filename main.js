import './style.css'

// Constants for the Flickr API key and image sizes
const API_KEY = 'b54580f369a7eeebecb2004dc429d08f'
const IMAGE_SMALL = 'q'
const IMAGE_MEDIUM = 'c'

// Render the initial HTML structure
document.querySelector('#app').innerHTML = `
  <div class="main">
    <nav id="menu">
      <div class="flex">
      <input type="search" placeholder="Enter text to search" id="search" required />
      <button id="btn-search">Search</button>
      </div>
      <div class="flex">
        <button id="btn-reset">Unselect all</button>
        <button id="btn-slide">Slide Show</button>
      </div>
    </nav>
    <div class="container">
      <div class="gallery">
    </div>
    <footer>
      <button id="btn-next-page">Next</button>
    </footer>
  </div>
`
// Select elements from the DOM
const searchInput = document.querySelector('#search')
const searchButton = document.querySelector('#btn-search')
const nextButton = document.querySelector('#btn-next-page')
const slideButton = document.querySelector('#btn-slide')
const resetAll = document.querySelector('#btn-reset')
const nav = document.querySelector('#menu')
const container = document.querySelector('.container')
const gallery = document.querySelector('.gallery')

// Add variables to keep track of current page and page number
let page = 1
let currentSearch = ''
nextButton.style.display = 'none'
slideButton.disabled = true

/**
 * Get the search input value and call the searchPictures function
 * If there's no input, use the previous search query
 */
function getSearchResults() {
  let textToSearch = searchInput.value
  currentSearch = textToSearch

  // Clean up the previous search
  gallery.innerHTML = ''
  page = 1

  return searchPictures(textToSearch)
}

/**
 * Create a spinner element and append it to the .main element
 * Hide the next button while the spinner is displayed
 */
function createSpinner() {
  const main = document.querySelector('.main')
  const spinner = document.createElement('div')
  spinner.classList.add('spinner')
  nextButton.style.display = 'none'

  main.appendChild(spinner)
}

/**
 * Remove the spinner element from the .main element
 * Show the next button when the spinner is removed
 */
function removeSpinner(pages) {
  const main = document.querySelector('.main')
  const spinner = main.querySelector('.spinner')

  if (spinner) {
    main.removeChild(spinner)
    slideButton.disabled = true

    if (pages && page !== pages) {
      nextButton.style.display = ''
    }
  }
}

/**
 * fetch pictures from flickr API
 * @param {string} query - search query
 */
function searchPictures(query) {
  const url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${API_KEY}&tags=${query}&page=${page}&format=json&nojsoncallback=1&per_page=30`

  createSpinner()

  return fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error(`Request rejected with status ${response.status}`)
      }
    })
    .then((data) => {
      removeSpinner(data.photos.pages)
      createGallery(data.photos.photo)
    })
    .catch((error) => {
      removeSpinner()
      console.error(error)
    })
}

/**
 * build the url for each image
 * @param {string} serverId
 * @param {string} photoId
 * @param {string} secret
 * @param {string} size
 */
function urlBuilder(serverId, photoId, secret, size) {
  return `https://live.staticflickr.com/${serverId}/${photoId}_${secret}_${size}.jpg`
}

/**
 * Displays a gallery of images using the given array of image data
 * @param {Array} array - An array of objects containing information about each image (serverId, photoId, secret)
 */
function createGallery(array) {
  // Use for loop (instead of forEach, map) for better performance
  for (let i = 0; i < array.length; i++) {
    const element = array[i]
    const img = document.createElement('img')
    const serverId = element.server
    const photoId = element.id
    const secret = element.secret

    img.src = urlBuilder(serverId, photoId, secret, IMAGE_SMALL)
    img.classList.add('gallery_image')
    img.serverId = serverId
    img.photoId = photoId
    img.secret = secret

    const div = document.createElement('div')
    div.classList.add('gallery_div')

    div.addEventListener('click', toggleSelected)

    gallery.appendChild(div).appendChild(img)
  }

  /**
   * Toggles the "picked" class on the clicked element and its child image
   * @param {Event} event - The click event
   */
  function toggleSelected(event) {
    const div = event.currentTarget
    const img = div.querySelector('img')

    div.classList.toggle('picked')
    img.classList.toggle('img-picked')

    const picked = document.querySelectorAll('.picked')

    if (picked.length !== 0) {
      slideButton.disabled = false
    } else {
      slideButton.disabled = true
    }
  }
}

/**
 * @function
 * @param {NodeList} array - A NodeList of elements with `serverId`, `photoId`, and `secret` properties
 * @returns {string[]} - An array of URLs built from the input elements' properties
 */
function getSrcArray(array) {
  return [...array].map((element) => {
    const serverId = element.serverId
    const photoId = element.photoId
    const secret = element.secret

    return urlBuilder(serverId, photoId, secret, IMAGE_MEDIUM)
  })
}

/**
 * Creates a lightbox with the images from the gallery.
 * Hides the gallery, nav, and nextButton elements, and adds the slider element to the container.
 * Creates next, prev, and close buttons for the slider.
 *
 * @function
 */
function createLightbox() {
  let curSlide = 0
  const imageArray = gallery.querySelectorAll('.img-picked')
  const srcArray = getSrcArray(imageArray)

  gallery.style.display = 'none'
  nav.style.display = 'none'
  nextButton.style.display = 'none'
  container.classList.add('grid')

  const slider = document.createElement('div')
  slider.classList.add('slider')
  container.appendChild(slider)

  srcArray.forEach((element) => {
    const div = document.createElement('div')
    div.classList.add('slide')

    const img = document.createElement('img')
    img.src = element

    slider.appendChild(div).appendChild(img)
  })

  const slides = document.querySelectorAll('.slide')

  slides.forEach((slide, indx) => {
    slide.style.transform = `translateX(${indx * 100}%)`
  })

  const next = document.createElement('button')
  next.classList.add('btn', 'btn-next')
  next.innerHTML += '>'

  const prev = document.createElement('button')
  prev.classList.add('btn', 'btn-prev')
  prev.innerHTML += '<'

  const close = document.createElement('button')
  close.classList.add('btn', 'btn-close')
  close.innerHTML += 'X'

  slider.appendChild(next)
  slider.appendChild(prev)
  slider.appendChild(close)

  function moveSlide(direction) {
    if (direction === 'next') {
      if (curSlide === slides.length - 1) {
        curSlide = 0
      } else {
        curSlide++
      }
    } else {
      if (curSlide === 0) {
        curSlide = slides.length - 1
      } else {
        curSlide--
      }
    }

    for (let i = 0; i < slides.length; i++) {
      slides[i].style.transform = `translateX(${100 * (i - curSlide)}%)`
    }
  }

  const nextSlide = document.querySelector('.btn-next')
  nextSlide.addEventListener('click', () => moveSlide('next'))

  const prevSlide = document.querySelector('.btn-prev')
  prevSlide.addEventListener('click', () => moveSlide('prev'))

  close.addEventListener('click', () => {
    gallery.style.display = ''
    nav.style.display = ''
    nextButton.style.display = ''
    const removeSlider = document.querySelector('.slider')
    removeSlider.remove()
    container.classList.remove('grid')
  })
}

searchButton.addEventListener('click', getSearchResults)
searchInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    searchButton.click()
  }
})

nextButton.addEventListener('click', () => {
  page++
  searchPictures(currentSearch)
})

slideButton.addEventListener('click', () => {
  createLightbox()
})

resetAll.addEventListener('click', () => {
  const picked = document.querySelectorAll('.picked, .img-picked')

  picked.forEach((element) => {
    element.classList.remove('picked', 'img-picked')
  })

  slideButton.disabled = true
})
