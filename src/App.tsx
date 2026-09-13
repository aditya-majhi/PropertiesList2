import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiInfo, FiPlus, FiX } from "react-icons/fi";
import {
  FaBed,
  FaBath,
  FaCouch,
  FaCar,
  FaRulerHorizontal,
  FaVectorSquare,
} from "react-icons/fa6";
import joshImage from "./assets/Josh.jpg";
import "./App.css";

type RawPropertyRecord = {
  Area: string;
  Lot: string;
  Estate: string;
  Suburb: string;
  Status: string;
  HomeDesign: string;
  Width: string;
  Depth: string;
  Orientation: string;
  LandSize: string;
  HouseSize: string;
  BuildPrice: string;
  LandPrice: string;
  TotalPrice: string;
  RantalAppraisal: string;
  RentalYield: string;
  TitleStatus: string;
  Storey: string;
  Beds: string;
  Baths: string;
  Cars: string;
  Living: string;
  Facade: string;
};

type PropertyRecord = {
  Area: string;
  Lot: string;
  Estate: string;
  Suburb: string;
  Status: string;
  HomeDesign: string;
  Width: number;
  Depth: number;
  Orientation: string;
  LandSize: number;
  HouseSize: number;
  BuildPrice: number;
  LandPrice: number;
  TotalPrice: number;
  RantalAppraisal: number;
  RentalYield: number;
  TitleStatus: string;
  Storey: string;
  Beds: number;
  Baths: number;
  Cars: number;
  Living: number;
  Facade: string;
};

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const PRICE_OPTIONS = [
  500000, 750000, 1000000, 1250000, 1500000, 1750000, 2000000,
];

const toNumber = (value: string) => {
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortNumberStrings = (values: number[]) =>
  [...new Set(values.filter(value => value > 0))]
    .sort((a, b) => a - b)
    .map(value => String(value));

const normalizeProperty = (item: RawPropertyRecord): PropertyRecord => ({
  Area: item.Area,
  Lot: item.Lot,
  Estate: item.Estate,
  Suburb: item.Suburb,
  Status: item.Status,
  HomeDesign: item.HomeDesign,
  Width: toNumber(item.Width),
  Depth: toNumber(item.Depth),
  Orientation: item.Orientation,
  LandSize: toNumber(item.LandSize),
  HouseSize: toNumber(item.HouseSize),
  BuildPrice: toNumber(item.BuildPrice),
  LandPrice: toNumber(item.LandPrice),
  TotalPrice: toNumber(item.TotalPrice),
  RantalAppraisal: toNumber(item.RantalAppraisal),
  RentalYield: toNumber(item.RentalYield),
  TitleStatus: item.TitleStatus,
  Storey: item.Storey,
  Beds: toNumber(item.Beds),
  Baths: toNumber(item.Baths),
  Cars: toNumber(item.Cars),
  Living: toNumber(item.Living),
  Facade: item.Facade,
});

//Agent's Details
const agent = {
  name: "Josh Zammit",
  mobile: "0430 506 092",
  email: "joshua@zammitrealestate.com.au",
};

const buildMailtoHref = (property: PropertyRecord) =>
  `mailto:${agent.email}?subject=${encodeURIComponent(
    `Enquiry: ${property.HomeDesign} - Lot ${property.Lot}`
  )}&body=${encodeURIComponent(
    `Hi ${agent.name},\n\nI'm interested in ${property.HomeDesign} (Lot ${property.Lot}, ${property.Suburb}). Please contact me with more details.`
  )}`;

function App() {
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("Any");
  const [storeyFilter, setStoreyFilter] = useState("Any");
  const [bedsFilter, setBedsFilter] = useState("Any");
  const [maximumBedsFilter, setMaximumBedsFilter] = useState("Any");
  const [bathsFilter, setBathsFilter] = useState("Any");
  const [carsFilter, setCarsFilter] = useState("Any");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [minimumLandSize, setMinimumLandSize] = useState("");
  const [maximumLandSize, setMaximumLandSize] = useState("");

  const [agentModalProperty, setAgentModalProperty] =
    useState<PropertyRecord | null>(null);

  useEffect(() => {
    if (window.parent === window) return;

    let frameId = 0;

    const sendHeight = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const documentElement = document.documentElement;
        const body = document.body;
        const height = Math.max(
          documentElement.scrollHeight,
          documentElement.offsetHeight,
          body.scrollHeight,
          body.offsetHeight
        );

        window.parent.postMessage(
          { type: "property-listings-height", height },
          "*"
        );
      });
    };

    sendHeight();

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    const mutationObserver = new MutationObserver(sendHeight);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener("resize", sendHeight);
    window.addEventListener("load", sendHeight);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", sendHeight);
      window.removeEventListener("load", sendHeight);
    };
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      const response = await fetch("/data/data.json");
      const data = (await response.json()) as RawPropertyRecord[];
      setProperties(data.map(normalizeProperty));
    };

    loadProperties()
      .catch(() => setProperties([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setIsFiltering(true);
    setVisibleCount(PAGE_SIZE);

    const timeoutId = window.setTimeout(() => {
      setIsFiltering(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    areaFilter,
    bathsFilter,
    bedsFilter,
    carsFilter,
    locationQuery,
    maximumBedsFilter,
    maximumLandSize,
    maximumPrice,
    minimumLandSize,
    minimumPrice,
    storeyFilter,
  ]);

  useEffect(() => {
    if (locationQuery.trim() !== "") {
      setIsSearchOpen(true);
    }
  }, [locationQuery]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = locationQuery.trim().toLowerCase();
    const minimumPriceValue = toNumber(minimumPrice);
    const maximumPriceValue = toNumber(maximumPrice);
    const minimumBedsValue = toNumber(bedsFilter);
    const maximumBedsValue = toNumber(maximumBedsFilter);
    const minimumLandSizeValue = toNumber(minimumLandSize);
    const maximumLandSizeValue = toNumber(maximumLandSize);

    const filtered = properties.filter(item => {
      const locationMatch =
        normalizedQuery.length === 0 ||
        [item.Suburb, item.Estate, item.Area].some(value =>
          value.toLowerCase().includes(normalizedQuery)
        );
      const areaMatch = areaFilter === "Any" || item.Area === areaFilter;
      const storeyMatch =
        storeyFilter === "Any" || item.Storey === storeyFilter;

      const bedsMatch =
        (bedsFilter === "Any" || item.Beds >= minimumBedsValue) &&
        (maximumBedsFilter === "Any" || item.Beds <= maximumBedsValue);
      const bathsMatch =
        bathsFilter === "Any" || String(item.Baths) === bathsFilter;
      const carsMatch =
        carsFilter === "Any" || String(item.Cars) === carsFilter;
      const statusMatch = item.Status.toLowerCase() === "available";
      const minimumPriceMatch =
        minimumPrice === "" || item.TotalPrice >= minimumPriceValue;
      const maximumPriceMatch =
        maximumPrice === "" || item.TotalPrice <= maximumPriceValue;
      const minimumLandSizeMatch =
        minimumLandSize === "" || item.LandSize >= minimumLandSizeValue;
      const maximumLandSizeMatch =
        maximumLandSize === "" || item.LandSize <= maximumLandSizeValue;

      return (
        locationMatch &&
        areaMatch &&
        storeyMatch &&
        bedsMatch &&
        bathsMatch &&
        carsMatch &&
        statusMatch &&
        minimumPriceMatch &&
        maximumPriceMatch &&
        minimumLandSizeMatch &&
        maximumLandSizeMatch
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => a.Suburb.localeCompare(b.Suburb));

    return sorted;
  }, [
    areaFilter,
    bathsFilter,
    bedsFilter,
    carsFilter,
    locationQuery,
    maximumBedsFilter,
    maximumLandSize,
    maximumPrice,
    minimumLandSize,
    minimumPrice,
    properties,
    storeyFilter,
  ]);

  // Loads more cards as the sentinel scrolls into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(count => count + PAGE_SIZE);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredProperties.length]);

  const bedsOptions = useMemo(
    () => ["Any", ...sortNumberStrings(properties.map(item => item.Beds))],
    [properties]
  );

  const areaOptions = useMemo(
    () => [
      "Any",
      ...Array.from(
        new Set(properties.map(item => item.Area?.trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [properties]
  );

  const storeyOptions = useMemo(
    () => [
      "Any",
      ...new Set(properties.map(item => item.Storey).filter(Boolean)),
    ],
    [properties]
  );

  const bathsOptions = useMemo(
    () => ["Any", ...sortNumberStrings(properties.map(item => item.Baths))],
    [properties]
  );

  const carsOptions = useMemo(
    () => ["Any", ...sortNumberStrings(properties.map(item => item.Cars))],
    [properties]
  );

  const landSizeOptions = useMemo(
    () => sortNumberStrings(properties.map(item => item.LandSize)),
    [properties]
  );

  const locationSuggestions = useMemo(() => {
    const normalizedQuery = locationQuery.trim().toLowerCase();
    if (normalizedQuery === "") return [];

    return Array.from(
      new Set(
        properties.flatMap(property => [
          property.Suburb,
          property.Estate,
          property.Area,
        ])
      )
    )
      .filter(value => value.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [locationQuery, properties]);

  const visibleProperties = useMemo(
    () => filteredProperties.slice(0, visibleCount),
    [filteredProperties, visibleCount]
  );

  const clearFilters = () => {
    setLocationQuery("");
    setAreaFilter("Any");
    setStoreyFilter("Any");
    setBedsFilter("Any");
    setMaximumBedsFilter("Any");
    setBathsFilter("Any");
    setCarsFilter("Any");
    setMinimumPrice("");
    setMaximumPrice("");
    setMinimumLandSize("");
    setMaximumLandSize("");
    setIsSearchOpen(false);
  };

  if (isLoading) {
    return (
      <main className="loading-screen" aria-label="Loading properties">
        <div className="loading-content">
          <span className="loading-spinner" aria-hidden="true" />
          <p>Loading house and land packages...</p>
        </div>
      </main>
    );
  }

  return isLoading ? (
    <main className="loading-screen" aria-label="Loading properties">
      <div className="loading-content">
        <span className="loading-spinner" aria-hidden="true" />
        <p>Loading house and land packages...</p>
      </div>
    </main>
  ) : (
    <main className="app-shell">
      <section className="search-toolbar" aria-label="Property search">
        <div className="search-field">
          <div className="search-input-wrap">
            <input
              id="location-query"
              value={locationQuery}
              onChange={event => {
                setLocationQuery(event.target.value);
              }}
              placeholder="Search by suburb, postcode, estate or address"
              autoComplete="off"
            />
            <FiSearch className="search-icon" aria-hidden="true" />
          </div>

          {isSearchOpen && locationQuery.trim() !== "" && (
            <span className="search-results" role="listbox">
              {locationSuggestions.map(value => (
                <button
                  type="button"
                  className="search-result"
                  key={value}
                  role="option"
                  onClick={() => {
                    setLocationQuery(value);
                    setIsSearchOpen(false);
                  }}
                >
                  {value}
                </button>
              ))}

              {locationSuggestions.length === 0 && (
                <span className="search-result-empty">
                  No matching locations
                </span>
              )}
            </span>
          )}
        </div>

        <button
          type="button"
          className="filter-toggle-button"
          onClick={() => setIsFilterPanelOpen(true)}
        >
          Filter
          <FiPlus aria-hidden="true" />
        </button>
      </section>

      {isFilterPanelOpen && (
        <div
          className="filter-panel-overlay"
          role="presentation"
          onClick={() => setIsFilterPanelOpen(false)}
        >
          <aside
            className="filter-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Property filters"
            onClick={event => event.stopPropagation()}
          >
            <header className="filter-panel-header">
              <h2>Filter</h2>
              <button
                type="button"
                className="close-filter-panel"
                onClick={() => setIsFilterPanelOpen(false)}
                aria-label="Close filters"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div className="filter-panel-content">
              <fieldset className="filter-group">
                <legend>Price</legend>
                <div className="filter-pair">
                  <label className="select-field" htmlFor="minimum-price">
                    <select
                      id="minimum-price"
                      value={minimumPrice}
                      onChange={event => setMinimumPrice(event.target.value)}
                    >
                      <option value="">Min</option>
                      {PRICE_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {currencyFormatter.format(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="select-field" htmlFor="maximum-price">
                    <select
                      id="maximum-price"
                      value={maximumPrice}
                      onChange={event => setMaximumPrice(event.target.value)}
                    >
                      <option value="">Max</option>
                      {PRICE_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {currencyFormatter.format(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className="filter-group filter-group-single">
                <legend>Area</legend>
                <label className="select-field" htmlFor="area-filter">
                  <select
                    id="area-filter"
                    value={areaFilter}
                    onChange={event => setAreaFilter(event.target.value)}
                  >
                    {areaOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="filter-group">
                <legend>Bedrooms</legend>
                <div className="filter-pair">
                  <label className="select-field" htmlFor="minimum-beds-filter">
                    <select
                      id="minimum-beds-filter"
                      value={bedsFilter}
                      onChange={event => setBedsFilter(event.target.value)}
                    >
                      <option value="Any">Min</option>
                      {bedsOptions.slice(1).map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="select-field" htmlFor="maximum-beds-filter">
                    <select
                      id="maximum-beds-filter"
                      value={maximumBedsFilter}
                      onChange={event =>
                        setMaximumBedsFilter(event.target.value)
                      }
                    >
                      <option value="Any">Max</option>
                      {bedsOptions.slice(1).map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className="filter-group filter-group-single">
                <legend>Storeys</legend>
                <label className="select-field" htmlFor="storey-filter">
                  <select
                    id="storey-filter"
                    value={storeyFilter}
                    onChange={event => setStoreyFilter(event.target.value)}
                  >
                    {storeyOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="filter-group filter-group-single">
                <legend>Bathrooms</legend>
                <label className="select-field" htmlFor="baths-filter">
                  <select
                    id="baths-filter"
                    value={bathsFilter}
                    onChange={event => setBathsFilter(event.target.value)}
                  >
                    {bathsOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="filter-group filter-group-single">
                <legend>Car spaces</legend>
                <label className="select-field" htmlFor="cars-filter">
                  <select
                    id="cars-filter"
                    value={carsFilter}
                    onChange={event => setCarsFilter(event.target.value)}
                  >
                    {carsOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="filter-group">
                <legend>Land size</legend>
                <div className="filter-pair">
                  <label className="select-field" htmlFor="minimum-land-size">
                    <select
                      id="minimum-land-size"
                      value={minimumLandSize}
                      onChange={event => setMinimumLandSize(event.target.value)}
                    >
                      <option value="">Min</option>
                      {landSizeOptions.map(option => (
                        <option key={option} value={option}>
                          {option}m²
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="select-field" htmlFor="maximum-land-size">
                    <select
                      id="maximum-land-size"
                      value={maximumLandSize}
                      onChange={event => setMaximumLandSize(event.target.value)}
                    >
                      <option value="">Max</option>
                      {landSizeOptions.map(option => (
                        <option key={option} value={option}>
                          {option}m²
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
            </div>

            <footer className="filter-panel-actions">
              <button
                type="button"
                className="clear-button"
                onClick={clearFilters}
              >
                Reset
              </button>
              <button
                type="button"
                className="apply-filter-button"
                onClick={() => setIsFilterPanelOpen(false)}
              >
                Show {filteredProperties.length} packages
              </button>
            </footer>
          </aside>
        </div>
      )}

      {isFiltering && (
        <div className="filter-loading" role="status">
          Updating packages...
        </div>
      )}

      <section className="results-grid" aria-live="polite">
        {visibleProperties.map((property, index) => (
          <article
            className="property-card"
            key={`${property.Lot}-${property.HomeDesign}-${property.Orientation}-${index}`}
          >
            <div className="card-image">
              <img
                src={property.Facade}
                alt={`${property.HomeDesign} facade`}
                loading="lazy"
              />
            </div>
            <div className="card-main">
              <header className="property-card-head">
                <h2>{property.Suburb}</h2>
              </header>

              <p className="price-line">
                <span className="price-label">Total price package </span>
                <strong>
                  {currencyFormatter.format(property.TotalPrice)}*
                </strong>
              </p>

              <p className="location-line">
                {property.Suburb} ({property.Estate})
                <br />
                Lot {property.Lot}
              </p>

              <p className="title-status">
                Title Status - {property.TitleStatus}{" "}
                <FiInfo className="inline-info" aria-hidden="true" />
              </p>

              <div className="detail-icons">
                <span title="Beds">
                  <FaBed /> {property.Beds}
                </span>
                <span title="Baths">
                  <FaBath /> {property.Baths}
                </span>
                <span title="Living">
                  <FaCouch /> {property.Living}
                </span>
                <span title="Cars">
                  <FaCar /> {property.Cars}
                </span>
                <span title="Width">
                  <FaRulerHorizontal /> {property.Width}m
                </span>
                <span title="Land size">
                  <FaVectorSquare /> {property.LandSize}m²
                </span>
              </div>
            </div>

            <footer className="card-footer">
              <button
                type="button"
                className="view-package secondary"
                onClick={() => setAgentModalProperty(property)}
              >
                View Details
              </button>
            </footer>
          </article>
        ))}

        {filteredProperties.length === 0 && (
          <article className="property-card empty-state">
            <h2>No matching packages</h2>
            <p>Try changing filters or clearing the current search.</p>
          </article>
        )}
      </section>

      {visibleCount < filteredProperties.length && (
        <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      )}

      {agentModalProperty !== null && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setAgentModalProperty(null)}
        >
          <section
            className="details-modal agent-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Agent details"
            onClick={event => event.stopPropagation()}
          >
            <header className="modal-header">
              <h3>Package Details</h3>
              <button
                type="button"
                className="close-modal"
                onClick={() => setAgentModalProperty(null)}
              >
                Close
              </button>
            </header>

            <div className="agent-info">
              <div className="agent-info-top">
                <img
                  className="agent-avatar"
                  src={joshImage}
                  alt={`${agent.name} profile`}
                />

                <div>
                  <div className="agent-info-label">Agent</div>
                  <div className="agent-info-name">{agent.name}</div>
                </div>
              </div>

              <div className="agent-info-grid">
                <div className="agent-info-item">
                  <span>Mobile:</span>
                  <strong>{agent.mobile}</strong>
                </div>
                <div className="agent-info-item">
                  <span>Email:</span>
                  <strong>{agent.email}</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <a
                className="package-link secondary"
                href={buildMailtoHref(agentModalProperty)}
              >
                Enquire now
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
