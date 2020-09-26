
import React, {
  FC, useEffect, useRef, useState, ChangeEvent,
} from 'react'
import { CountryCode, findPhoneNumbersInText } from 'libphonenumber-js'
import cx from 'classnames'
import omit from 'lodash.omit'
import FlagIconFactory from 'react-flag-icon-css'
import {
  detectMobile,
  findCountryBy,
  formatNumber,
  getCountry,
  getInitialCountry,
  getCountryList,
} from '../../utils'
import {
  ICountry,
  NumberFormat,
  IReturnValueObj,
  IsoCode,
  Region,
} from '../../types'
import './styles.scss'

const FlagIcon = FlagIconFactory(React, { useCssModules: false })

export interface IPhoneInputProps {
  /** Sets the format of the entered  phone number, in case of 'NATIONAL' the defaultCountry must be set */
  format?: NumberFormat;
  /** Sets the Placeholder text */
  placeholder?: string;
  /** Disables the Phone Nr. Input Field */
  disabled?: boolean;
  /** The function/method that returns the entered Phone Nr. */
  onChange: (data: string | IReturnValueObj) => void;
  /**
   * changes the retuned value into an Object that contains the phone number and country meta information
   * eg.:
   {
     phoneNumber: "+49 176 12345678",
     country: {
       name: "Germany (Deutschland)"
       iso2: "DE"
      }
    }
    */
   withCountryMeta?: boolean;
   /** Sets the initial Value of the Phone Number Input. This is usefull in case you need to set a phone number stored for example in a database */
   initialValue?: string;
   /** Sets the default country (use iso alpha-2 country code e.g 'US', 'GB', 'DE') */
   defaultCountry?: IsoCode;
   /** Lets you restrict the country dropdown to a specific list of countries (use iso alpha-2 country code e.g 'US', 'GB', 'DE') */
   preferredCountries?: IsoCode[];
   /** Lets you restrict the country dropdown to a list of countries in the specified regions */
   regions?: Region | Region[];
   /** Adds a custom class to the Phone Nr. Input Field */
   className?: string,
  }

export const PhoneInput: FC<IPhoneInputProps> = ({
  className,
  defaultCountry,
  preferredCountries,
  regions,
  format = 'INTERNATIONAL',
  initialValue,
  withCountryMeta = false,
  onChange,
  disabled = false,
  placeholder = '+1 702 123 4567',
}) => {
  const initialCountry = getInitialCountry(defaultCountry, preferredCountries, regions)
  const isInternational = format === 'INTERNATIONAL'
  const isMobile = detectMobile.any()

  const [country, setCountry] = useState<ICountry>(initialCountry)
  const [phoneNumber, setPhoneNumber] = useState(isInternational ? initialCountry?.dialCode : '')
  const [showCountries, setShowCountries] = useState(false)

  const phoneInputWrapper = useRef<HTMLDivElement>(null)
  const phoneInput = useRef<HTMLInputElement>(null)
  const countryList = useRef<HTMLUListElement>(null)
  const activeCountry = useRef<HTMLLIElement>(null)

  const { iso2 } = country

  useEffect(() => {
    const data: string | IReturnValueObj = withCountryMeta
      ? { phoneNumber, country: omit(country, ['hasAreaCodes', 'isAreaCode', 'dialCode', 'regions']) }
      : phoneNumber

    if (showCountries && iso2 && iso2 !== 'INTL' && countryList.current && activeCountry.current) {
      countryList.current.scrollTop = (activeCountry.current.offsetTop - 50)
    }

    onChange(data)
  }, [country, phoneNumber, showCountries])

  useEffect(() => {
    const clickOutside = (e: Event): void => {
      if (phoneInputWrapper.current && !phoneInputWrapper.current.contains(e.target as Node)) {
        setShowCountries(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)

    if (initialValue) {
      const formated = formatNumber(initialValue, format, iso2 as CountryCode)
      const metaData = findPhoneNumbersInText(initialValue)

      setCountry(findCountryBy('iso2', metaData[0].number.country || 'INTL'))
      setPhoneNumber(formated.length > 0 ? formated : initialValue)
    }

    return (): void => {
      document.removeEventListener('mousedown', clickOutside)
    }
  }, [])

  const handleSelect = (countryCode: IsoCode) => (): void => {
    const selectedCountry = findCountryBy('iso2', countryCode)

    setCountry(selectedCountry)
    setPhoneNumber(selectedCountry.dialCode)
    setShowCountries(false)

    phoneInput.current?.focus()
  }

  const handleToggleList = (): void => {
    if (!disabled) {
      setShowCountries(prevShowCountries => !prevShowCountries)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target

    if (!value.length) {
      setCountry(initialCountry)
      setPhoneNumber('')

      return
    }

    if (!(/^[\d ()+-]+$/).test(value)) return
    const formated = formatNumber(value, format, iso2 as CountryCode)
    const selectedCountry = getCountry(formated.length > 0 ? formated : value)

    setCountry(prevCountry => (isInternational && selectedCountry ? selectedCountry : prevCountry))

    setPhoneNumber(formated.length > 0 ? formated : value)
  }

  return (
    <div className="react-phonenr-input" ref={phoneInputWrapper}>
      {
        isInternational && (
          <div
            onClick={!isMobile ? handleToggleList : undefined}
            className="flag-wrapper"
            role="none"
          >
            {
              iso2 === 'INTL'
                ? (
                  <svg width={20} height={20} viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                    <path d="M896 128q209 0 385.5 103t279.5 279.5 103 385.5-103 385.5-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103zm274 521q-2 1-9.5 9.5t-13.5 9.5q2 0 4.5-5t5-11 3.5-7q6-7 22-15 14-6 52-12 34-8 51 11-2-2 9.5-13t14.5-12q3-2 15-4.5t15-7.5l2-22q-12 1-17.5-7t-6.5-21q0 2-6 8 0-7-4.5-8t-11.5 1-9 1q-10-3-15-7.5t-8-16.5-4-15q-2-5-9.5-11t-9.5-10q-1-2-2.5-5.5t-3-6.5-4-5.5-5.5-2.5-7 5-7.5 10-4.5 5q-3-2-6-1.5t-4.5 1-4.5 3-5 3.5q-3 2-8.5 3t-8.5 2q15-5-1-11-10-4-16-3 9-4 7.5-12t-8.5-14h5q-1-4-8.5-8.5t-17.5-8.5-13-6q-8-5-34-9.5t-33-.5q-5 6-4.5 10.5t4 14 3.5 12.5q1 6-5.5 13t-6.5 12q0 7 14 15.5t10 21.5q-3 8-16 16t-16 12q-5 8-1.5 18.5t10.5 16.5q2 2 1.5 4t-3.5 4.5-5.5 4-6.5 3.5l-3 2q-11 5-20.5-6t-13.5-26q-7-25-16-30-23-8-29 1-5-13-41-26-25-9-58-4 6-1 0-15-7-15-19-12 3-6 4-17.5t1-13.5q3-13 12-23 1-1 7-8.5t9.5-13.5.5-6q35 4 50-11 5-5 11.5-17t10.5-17q9-6 14-5.5t14.5 5.5 14.5 5q14 1 15.5-11t-7.5-20q12 1 3-17-4-7-8-9-12-4-27 5-8 4 2 8-1-1-9.5 10.5t-16.5 17.5-16-5q-1-1-5.5-13.5t-9.5-13.5q-8 0-16 15 3-8-11-15t-24-8q19-12-8-27-7-4-20.5-5t-19.5 4q-5 7-5.5 11.5t5 8 10.5 5.5 11.5 4 8.5 3q14 10 8 14-2 1-8.5 3.5t-11.5 4.5-6 4q-3 4 0 14t-2 14q-5-5-9-17.5t-7-16.5q7 9-25 6l-10-1q-4 0-16 2t-20.5 1-13.5-8q-4-8 0-20 1-4 4-2-4-3-11-9.5t-10-8.5q-46 15-94 41 6 1 12-1 5-2 13-6.5t10-5.5q34-14 42-7l5-5q14 16 20 25-7-4-30-1-20 6-22 12 7 12 5 18-4-3-11.5-10t-14.5-11-15-5q-16 0-22 1-146 80-235 222 7 7 12 8 4 1 5 9t2.5 11 11.5-3q9 8 3 19 1-1 44 27 19 17 21 21 3 11-10 18-1-2-9-9t-9-4q-3 5 .5 18.5t10.5 12.5q-7 0-9.5 16t-2.5 35.5-1 23.5l2 1q-3 12 5.5 34.5t21.5 19.5q-13 3 20 43 6 8 8 9 3 2 12 7.5t15 10 10 10.5q4 5 10 22.5t14 23.5q-2 6 9.5 20t10.5 23q-1 0-2.5 1t-2.5 1q3 7 15.5 14t15.5 13q1 3 2 10t3 11 8 2q2-20-24-62-15-25-17-29-3-5-5.5-15.5t-4.5-14.5q2 0 6 1.5t8.5 3.5 7.5 4 2 3q-3 7 2 17.5t12 18.5 17 19 12 13q6 6 14 19.5t0 13.5q9 0 20 10.5t17 19.5q5 8 8 26t5 24q2 7 8.5 13.5t12.5 9.5l16 8 13 7q5 2 18.5 10.5t21.5 11.5q10 4 16 4t14.5-2.5 13.5-3.5q15-2 29 15t21 21q36 19 55 11-2 1 .5 7.5t8 15.5 9 14.5 5.5 8.5q5 6 18 15t18 15q6-4 7-9-3 8 7 20t18 10q14-3 14-32-31 15-49-18 0-1-2.5-5.5t-4-8.5-2.5-8.5 0-7.5 5-3q9 0 10-3.5t-2-12.5-4-13q-1-8-11-20t-12-15q-5 9-16 8t-16-9q0 1-1.5 5.5t-1.5 6.5q-13 0-15-1 1-3 2.5-17.5t3.5-22.5q1-4 5.5-12t7.5-14.5 4-12.5-4.5-9.5-17.5-2.5q-19 1-26 20-1 3-3 10.5t-5 11.5-9 7q-7 3-24 2t-24-5q-13-8-22.5-29t-9.5-37q0-10 2.5-26.5t3-25-5.5-24.5q3-2 9-9.5t10-10.5q2-1 4.5-1.5t4.5 0 4-1.5 3-6q-1-1-4-3-3-3-4-3 7 3 28.5-1.5t27.5 1.5q15 11 22-2 0-1-2.5-9.5t-.5-13.5q5 27 29 9 3 3 15.5 5t17.5 5q3 2 7 5.5t5.5 4.5 5-.5 8.5-6.5q10 14 12 24 11 40 19 44 7 3 11 2t4.5-9.5 0-14-1.5-12.5l-1-8v-18l-1-8q-15-3-18.5-12t1.5-18.5 15-18.5q1-1 8-3.5t15.5-6.5 12.5-8q21-19 15-35 7 0 11-9-1 0-5-3t-7.5-5-4.5-2q9-5 2-16 5-3 7.5-11t7.5-10q9 12 21 2 8-8 1-16 5-7 20.5-10.5t18.5-9.5q7 2 8-2t1-12 3-12q4-5 15-9t13-5l17-11q3-4 0-4 18 2 31-11 10-11-6-20 3-6-3-9.5t-15-5.5q3-1 11.5-.5t10.5-1.5q15-10-7-16-17-5-43 12zm-163 877q206-36 351-189-3-3-12.5-4.5t-12.5-3.5q-18-7-24-8 1-7-2.5-13t-8-9-12.5-8-11-7q-2-2-7-6t-7-5.5-7.5-4.5-8.5-2-10 1l-3 1q-3 1-5.5 2.5t-5.5 3-4 3 0 2.5q-21-17-36-22-5-1-11-5.5t-10.5-7-10-1.5-11.5 7q-5 5-6 15t-2 13q-7-5 0-17.5t2-18.5q-3-6-10.5-4.5t-12 4.5-11.5 8.5-9 6.5-8.5 5.5-8.5 7.5q-3 4-6 12t-5 11q-2-4-11.5-6.5t-9.5-5.5q2 10 4 35t5 38q7 31-12 48-27 25-29 40-4 22 12 26 0 7-8 20.5t-7 21.5q0 6 2 16z" />
                  </svg>
                )
                : <FlagIcon code={iso2.toLocaleLowerCase()} />
            }
            {
              isMobile && (
                <select
                  className={className}
                  onChange={handleSelect(iso2)}
                  disabled={disabled}
                >
                  {
                    getCountryList(preferredCountries, regions).map(c => {
                      if (c.isAreaCode) {
                        return null
                      }

                      return (
                        <option key={c.iso2} value={c.iso2}>
                          {c.name}
                        </option>
                      )
                    })
                  }
                </select>
              )
            }
          </div>
        )
      }
      <input
        className={className}
        type="tel"
        value={phoneNumber}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        ref={phoneInput}
        maxLength={21}
      />
      {
        showCountries && isInternational && !isMobile && (
          <ul className="country-list" ref={countryList}>
            {
              getCountryList(preferredCountries, regions).map(c => {
                if (c.isAreaCode) {
                  return null
                }

                return (
                  <li
                    key={c.iso2}
                    className={cx('country-list-item', { 'active-country': c.iso2 === iso2 })}
                    ref={c.iso2 === iso2 ? activeCountry : null}
                    onClick={handleSelect(c.iso2)}
                    role="presentation"
                  >
                    {c.iso2 !== 'INTL' && <FlagIcon code={c.iso2.toLocaleLowerCase()} />}
                    {` (${c.dialCode}) ${c.name}`}
                  </li>
                )
              })
            }
          </ul>
        )
      }
    </div>
  )
}
