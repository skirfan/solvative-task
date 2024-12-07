import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";
const API_KEY = "35a791223cmsh83e02177ee08b29p1bf328jsn2f3da5e07702";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCities = useCallback(async (query, page = 1, limit = 5) => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
        },
        params: {
          namePrefix: query,
          offset: (page - 1) * limit,
          limit,
        },
      });
      setData(response.data.data);
      setTotalCount(response.data.metadata.totalCount);
    } catch (error) {
      console.error(error);
      setData([]);
    }
    setLoading(false);
  }, []);

  const debouncedFetchCities = useCallback(
    debounce((query) => {
      setPage(1);
      fetchCities(query, 1, limit);
    }, 500),
    [fetchCities, limit]
  );

  const debouncedPageChange = useCallback(
    debounce((newPage) => {
      setPage(newPage);
      fetchCities(searchQuery, newPage, limit);
    }, 500),
    [fetchCities, searchQuery, limit]
  );

  const debouncedLimitChange = useCallback(
    debounce((newLimit) => {
      setLimit(newLimit);
      fetchCities(searchQuery, page, newLimit);
    }, 500),
    [searchQuery, page]
  );

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      debouncedFetchCities(searchQuery);
    }
  };

  const handleLimitChange = (e) => {
    const value = Math.min(Math.max(parseInt(e.target.value, 10) || 5, 1), 10);
    debouncedLimitChange(value);
  };

  const handleKeyboardShortcut = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      document.getElementById("search-box").focus();
    }
  };

  const handlePageChange = (newPage) => {
    debouncedPageChange(newPage);
  };

  const getPageNumbers = () => {
    const totalPages = Math.ceil(totalCount / limit);

    const pageNumbers = [];
    let start = page - 1;
    let end = page + 1;

    if (start < 1) {
      start = 1;
      end = Math.min(3, totalPages);
    }
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - 2);
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  useEffect(() => {
    fetchCities("", 1, limit);
  }, [fetchCities]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  return (
    <div className="app">
      <div className="search-container">
        <input
          id="search-box"
          disabled={loading}
          type="text"
          className="search-box"
          placeholder="Search places..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <span className="shortcut">Ctrl + /</span>
      </div>
      <div className="table-container">
        {loading && <div className="spinner-overlay">Loading...</div>}
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Place Name</th>
              <th>Country</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((city, index) => (
                <tr key={city.id}>
                  <td>{index + 1 + (page - 1) * limit}</td>
                  <td>{city.city}</td>
                  <td>
                    <img
                      src={`https://flagsapi.com/${city.countryCode}/flat/24.png`}
                      alt={city.country}
                      className="flag"
                    />
                    {city.country}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  {searchQuery ? "No result found" : "Start searching"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="pagination-btn"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={
                  pageNum === page ? "active pagination-btn" : "pagination-btn"
                }
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil(totalCount / limit)}
              className="pagination-btn"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(Math.ceil(totalCount / limit))}
              disabled={page === Math.ceil(totalCount / limit)}
              className="pagination-btn"
            >
              Last
            </button>
          </div>
          <select
            value={limit}
            onChange={handleLimitChange}
            className="limit-input"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default App;
