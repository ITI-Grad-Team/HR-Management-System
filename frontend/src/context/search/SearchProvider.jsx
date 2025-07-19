import { useState } from "react";
import { SearchContext } from "./SearchContext";

export const SearchProvider = ({ children }) => {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
            {children}
        </SearchContext.Provider>
    );
};


