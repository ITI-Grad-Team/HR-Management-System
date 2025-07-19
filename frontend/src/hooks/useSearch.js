import { useContext } from "react";
import { SearchContext } from "../context/search/SearchContext";

export const useSearch = () => useContext(SearchContext);
