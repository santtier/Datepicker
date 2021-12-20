/* globals getComputedStyle */
const defaults = {
  date: new Date(),
  inputElement: '' // Required
}

export default function Datepicker (options) {
  options = Object.assign({}, defaults, options)
  const { inputElement } = options

  const state = {
    date: options.date
  }

  const datepickerElement = createElement.datepicker(state.date)
  const previousButton = datepickerElement.querySelector(
    '.datepicker__previous'
  )
  const nextButton = datepickerElement.querySelector('.datepicker__next')
  const yearMonthElement = datepickerElement.querySelector(
    '.datepicker__year-month'
  )
  const calendarGrid = datepickerElement.querySelector('.datepicker__date-grid')

  const datepicker = {
    hideDatepicker () {
      datepickerElement.setAttribute('hidden', true)
      delete inputElement.dataset.state
    },

    showDatepicker () {
      datepickerElement.removeAttribute('hidden')
      inputElement.dataset.state = 'focus'
    },

    positionDatepickerElement () {
      const inputRect = inputElement.getBoundingClientRect()
      const oneRem = parseInt(getComputedStyle(document.body)['font-size'])
      datepickerElement.style.left = `${inputRect.left}px`
      datepickerElement.style.top = `${inputRect.bottom + oneRem}px`
    },

    displayMonth (date) {
      // Updates the calendar
      yearMonthElement.innerHTML = createElement.calendarYearMonth(
        date
      ).innerHTML
      calendarGrid.innerHTML = createElement.calendarGrid(date).innerHTML

      // Update State
      state.date = date
    },

    getDateFromTimeEl (timeEl) {
      const datetime = timeEl.getAttribute('datetime')
      const [year, month, day = 1] = datetime
        .split('-')
        .map(num => parseInt(num))

      return new Date(year, month - 1, day)
    },

    handlePreviousMonthClick () {
      const year = state.date.getFullYear()
      const month = state.date.getMonth()
      const targetDate = new Date(year, month - 1)

      datepicker.displayMonth(targetDate)
    },

    handleNextMonthClick () {
      const year = state.date.getFullYear()
      const month = state.date.getMonth()
      const targetDate = new Date(year, month + 1)

      datepicker.displayMonth(targetDate)
    },

    handleCalendarGridClick (event) {
      if (!event.target.matches('button')) return

      const dateEl = event.target
      const dateEls = [...calendarGrid.children]

      // Highlights the selected button (and corrects tabindex)
      dateEls.forEach(button => {
        button.classList.remove('is-selected')
        button.setAttribute('tabindex', '-1')
      })
      dateEl.classList.add('is-selected')
      dateEl.removeAttribute('tabindex')

      // Gets selected date
      const timeEl = dateEl.firstElementChild
      const selectedDate = datepicker.getDateFromTimeEl(timeEl)

      // Formats date for output
      const year = selectedDate.getFullYear()
      const month = helpers.twoDigitString(selectedDate.getMonth() + 1)
      const day = helpers.twoDigitString(selectedDate.getDate())
      const formatted = `${day}/${month}/${year}`

      // Output date to the input element
      inputElement.value = formatted
    },

    handleInputFocus (event) {
      datepicker.showDatepicker()
    },

    handleOutsideClick (event) {
      if (event.target.closest('.datepicker')) return
      if (event.target.closest('input') === inputElement) return
      datepicker.hideDatepicker()
    },

    handleTabFromInput (event) {
      if (event.key !== 'Tab') return
      if (event.shiftKey) return
      event.preventDefault()
      const focusablesInDatepicker = datepickerElement.querySelectorAll(
        'button'
      )
      focusablesInDatepicker[0].focus()
    },

    handleTabFromDatepicker (event) {
      if (event.key !== 'Tab') return
      if (!event.target.matches('.datepicker__date')) return
      event.preventDefault()

      const focusableElements = helpers.getFocusableElements()
      const index = focusableElements.findIndex(
        element => element === inputElement
      )
      focusableElements[index + 1].focus()
      datepicker.hideDatepicker()
    },

    handleArrowKeys (event) {
      const { key } = event
      if (
        key !== 'ArrowUp' &&
        key !== 'ArrowDown' &&
        key !== 'ArrowLeft' &&
        key !== 'ArrowRight'
      ) {
        return
      }
      event.preventDefault()

      const { activeElement } = document
      const dates = calendarGrid.children
      const daysInMonth = dates.length

      if (
        activeElement === previousButton ||
        activeElement === nextButton ||
        activeElement === inputElement
      ) {
        const selectedDate = calendarGrid.querySelector('.is-selected')
        if (selectedDate) return selectedDate.focus()
        return dates[0].focus()
      }

      const focusedIndex = [...dates].findIndex(
        d => d === document.activeElement
      )

      if (!event.shiftKey) {
        // Previous day
        if (key === 'ArrowLeft') {
          if (focusedIndex === 0) {
            previousButton.click()
            dates[dates.length - 1].focus()
            return
          }
          return dates[focusedIndex - 1].focus()
        }

        // Next day
        if (key === 'ArrowRight') {
          if (focusedIndex === dates.length - 1) {
            nextButton.click()
            dates[0].focus()
            return
          }
          return dates[focusedIndex + 1].focus()
        }

        // Previous week
        if (key === 'ArrowUp') {
          if (focusedIndex < 7) {
            previousButton.click()
            const date = dates[dates.length - (7 - focusedIndex)]
            date.focus()
            return
          }
          return dates[focusedIndex - 7].focus()
        }

        // Next week
        if (key === 'ArrowDown') {
          if (focusedIndex + 7 > dates.length - 1) {
            nextButton.click()
            dates[focusedIndex + 7 - daysInMonth].focus()
            return
          }
          return dates[focusedIndex + 7].focus()
        }
      }

      if (event.shiftKey) {
        // Previous month
        if (key === 'ArrowLeft') {
          previousButton.click()
          const date = dates[focusedIndex] || dates[dates.length - 1]
          date.focus()
          return
        }

        // Next month
        if (key === 'ArrowRight') {
          nextButton.click()
          dates[0].focus()
          return
        }

        // Previous year
        if (key === 'ArrowUp') {
          const timeEl = dates[focusedIndex].firstElementChild

          const date = datepicker.getDateFromTimeEl(timeEl)
          const year = date.getFullYear()
          const month = date.getMonth()
          const day = date.getDate()

          // Set the new calendar
          const targetDate = new Date(year - 1, month, day)
          datepicker.displayMonth(targetDate)

          const button = dates[focusedIndex] || dates[dates.length - 1]
          button.focus()
          return
        }

        // Next year
        if (key === 'ArrowDown') {
          const timeEl = dates[focusedIndex].firstElementChild

          const date = datepicker.getDateFromTimeEl(timeEl)
          const year = date.getFullYear()
          const month = date.getMonth()
          const day = date.getDate()

          // Set the new calendar
          const targetDate = new Date(year + 1, month, day)
          datepicker.displayMonth(targetDate)
          const button = dates[focusedIndex] || dates[dates.length - 1]
          button.focus()
        }
      }
    }
  }

  // Execution
  document.body.appendChild(datepickerElement)
  datepicker.positionDatepickerElement()
  datepicker.hideDatepicker()

  document.addEventListener('click', datepicker.handleOutsideClick)
  previousButton.addEventListener('click', datepicker.handlePreviousMonthClick)
  nextButton.addEventListener('click', datepicker.handleNextMonthClick)
  calendarGrid.addEventListener('click', datepicker.handleCalendarGridClick)

  inputElement.addEventListener('focus', datepicker.handleInputFocus)
  inputElement.addEventListener('keydown', datepicker.handleTabFromInput)
  inputElement.addEventListener('keydown', datepicker.handleArrowKeys)

  datepickerElement.addEventListener(
    'keydown',
    datepicker.handleTabFromDatepicker
  )
  datepickerElement.addEventListener('keydown', datepicker.handleArrowKeys)

  return datepicker
}

const createElement = {
  datepicker (date) {
    const datepicker = document.createElement('div')
    datepicker.classList.add('datepicker')

    datepicker.innerHTML = `
      <div class='datepicker__buttons'>
        <button class='datepicker__previous'>
          <svg viewBox='0 0 20 20'>
            <path fill='currentColor' d='M7.05 9.293L6.343 10 12 15.657l1.414-1.414L9.172 10l4.242-4.243L12 4.343z' />
          </svg>
        </button>
  
        <button class='datepicker__next'>
          <svg viewBox='0 0 20 20'>
            <path fill='currentColor' d='M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z' />
          </svg>
        </button>
      </div>
      
      <div class='datepicker__calendar'>
        <div class='datepicker__year-month'>
          ${createElement.calendarYearMonth(date).innerHTML}
        </div>
        <div class='datepicker__day-of-week'>
          <div>Su</div>
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
        </div>
        <div class='datepicker__date-grid'>
          ${createElement.calendarGrid(date).innerHTML}
        </div>
      </div>
    `

    return datepicker
  },

  calendarYearMonth (date) {
    const monthsInAYear = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]

    const year = date.getFullYear()
    const targetMonth = date.getMonth()
    const monthName = monthsInAYear[targetMonth]
    const datetimeMonth = helpers.twoDigitString(targetMonth + 1)

    const div = document.createElement('div')

    const timeEl = document.createElement('time')
    timeEl.setAttribute('datetime', `${year}-${datetimeMonth}`)
    timeEl.textContent = `${monthName} ${year}`

    div.appendChild(timeEl)
    return div
  },

  calendarGrid (date) {
    const dategrid = document.createElement('div')

    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDayOfMonth = new Date(date.setDate(1)).getDay()
    const lastDayInMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayInMonth.getDate()

    const datetimeMonth = helpers.twoDigitString(month + 1)

    for (let day = 1; day <= daysInMonth; day++) {
      const button = document.createElement('button')
      button.classList.add('datepicker__date')
      button.setAttribute('type', 'button')

      if (day === 1) {
        button.style.setProperty('--firstDayOfMonth', firstDayOfMonth + 1)
      }
      if (day !== 1) button.setAttribute('tabindex', '-1')

      const datetimeDay = helpers.twoDigitString(day)
      button.innerHTML = `
      <time datetime="${year}-${datetimeMonth}-${datetimeDay}">${day}</time>
    `

      dategrid.appendChild(button)
    }

    return dategrid
  }
}

const helpers = {
  twoDigitString (number) {
    return number.toString().padStart(2, '0')
  },

  getFocusableElements (element = document) {
    return [
      ...element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ]
  }
}
