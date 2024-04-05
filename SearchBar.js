import React, { useEffect, useReducer } from 'react';

const initialState = {
  searchItems: [],
  winner: null,
  error: null,
  currentComparison: [],
};

const actionTypes = {
  SET_SEARCH_ITEMS: "SET_SEARCH_ITEMS",
  SET_WINNER: "SET_WINNER",
  SET_ERROR: "SET_ERROR",
  SET_COMPARISON: "SET_COMPARISON",
  REJECT_IMAGE: "REJECT_IMAGE",
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_SEARCH_ITEMS:
      return { ...state, searchItems: action.payload };
    case actionTypes.SET_WINNER:
      return { ...state, winner: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case actionTypes.SET_COMPARISON:
      return { ...state, currentComparison: action.payload };
    case actionTypes.REJECT_IMAGE:
      const updatedItems = state.searchItems.map(item => {
        if (item.index === action.payload.index) {
          return { ...item, rejected: true };
        }
        return item;
      });
      return { ...state, searchItems: updatedItems };
    default:
      return state;
  }
};

const SearchBar = () => {
  const dataset = "https://randomuser.me/api/?results=1000&gender=female";

  const [state, dispatch] = useReducer(reducer, initialState);
  const { searchItems, winner, error, currentComparison } = state;

  useEffect(() => {
    fetchData();
  }, []);

  const handleFetchError = (error) => {
    console.error("Error fetching data:", error);
    dispatch({ type: actionTypes.SET_ERROR, payload: "Error fetching data" });
  };

  const fetchData = async () => {
    try {
      const response = await fetch(dataset);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const { results } = await response.json();
      const searchItems = results.map((user, index) => ({
        url: user.picture.large,
        name: `${user.name.first} ${user.name.last}`,
        index,
        rejected: false,
      }));
      dispatch({ type: actionTypes.SET_SEARCH_ITEMS, payload: searchItems });
      setComparison(searchItems[0], searchItems[1]);
    } catch (error) {
      handleFetchError(error);
    }
  };

  const setComparison = (item1, item2) => {
    dispatch({ type: actionTypes.SET_COMPARISON, payload: [item1, item2] });
  };

  const handleReject = (index) => {
    dispatch({ type: actionTypes.REJECT_IMAGE, payload: { index: index } });
    const remainingItems = searchItems.filter(item => !item.rejected);
    if (remainingItems.length >= 2) {
      setComparison(remainingItems[0], remainingItems[1]);
    } else if (remainingItems.length === 1) {
      dispatch({ type: actionTypes.SET_WINNER, payload: remainingItems[0] });
    }

    const rejectedItem = searchItems.find(item => item.index === index);
    postData(rejectedItem);
  };

  const postData = async (rejectedItem) => {
    try {
      const res = await fetch(
        "https://facesmash-6e8a6-default-rtdb.firebaseio.com//facemashapp.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: rejectedItem.name,
            url: rejectedItem.url,
            rejected: true,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to post data to Firebase");
      }

      console.log("Data posted successfully");
    } catch (error) {
      console.error("Error posting data to Firebase:", error);
    }
  };

  return (
    <div className="searchBar">
      <h1>Facesmash</h1>
      {error ? (
        <div className="errorContainer">
          <p>{error}</p>
        </div>
      ) : winner ? (
        <div className="winnerContainer">
          <h2>The winner is:</h2>
          <img src={winner.url} alt="Winner" className="winnerImage" />
          <p>{winner.name}</p>
        </div>
      ) : (
        <div className="imageContainer">
          {currentComparison.map(item => (
            <div key={item.index} className="imageContainerItem">
              <img src={item.url} alt={item.name} className="userImage" />
              <p>{item.name}</p>
              <button onClick={() => handleReject(item.index)}>Reject</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
