import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Popover, Position, Spinner } from '@blueprintjs/core';

const SearchFilterCountries = ({ loaded, countries, currentCountries, onOpen, onChange }) => {

  function toggleCountryId(countryId) {
    const newValue = currentCountries.indexOf(countryId) > -1 ?
      currentCountries.filter(i => i !== countryId) : [...currentCountries, countryId];

    onChange(newValue);
  }

  return (
    <Popover position={Position.BOTTOM} popoverWillOpen={onOpen} inline={true}>
      <Button rightIconName="caret-down">
        <FormattedMessage id="search.collections" defaultMessage="Countries"/>
        {loaded && <span> (<FormattedNumber value={countries.length} />)</span>}
      </Button>
      <div className="search-filter-countries">
        {loaded ?
          <ul className="search-filter-countries-list">
            {countries.map(country => (
              <li onClick={toggleCountryId.bind(null, country.id)} key={country.id}>
                <span className="pt-icon-standard pt-icon-tick"
                  style={{'visibility': currentCountries.indexOf(country.id) > -1 ? 'visible': 'hidden'}} />
                {country.label}
              </li>
            ))}
          </ul> :
          <Spinner className="pt-large" />}
      </div>
    </Popover>
  );
};

export default SearchFilterCountries;
