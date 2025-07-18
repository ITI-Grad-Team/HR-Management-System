import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageItems = () => {
        const items = [];
        const maxPagesToShow = 5;
        const halfPagesToShow = Math.floor(maxPagesToShow / 2);

        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else if (currentPage <= halfPagesToShow) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + halfPagesToShow >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - halfPagesToShow;
            endPage = currentPage + halfPagesToShow;
        }

        items.push(
            <BootstrapPagination.First key="first" onClick={() => onPageChange(1)} disabled={currentPage === 1} />
        );
        items.push(
            <BootstrapPagination.Prev key="prev" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />
        );

        if (startPage > 1) {
            items.push(<BootstrapPagination.Ellipsis key="start-ellipsis" />);
        }

        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <BootstrapPagination.Item key={page} active={page === currentPage} onClick={() => onPageChange(page)}>
                    {page}
                </BootstrapPagination.Item>
            );
        }

        if (endPage < totalPages) {
            items.push(<BootstrapPagination.Ellipsis key="end-ellipsis" />);
        }

        items.push(
            <BootstrapPagination.Next key="next" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} />
        );
        items.push(
            <BootstrapPagination.Last key="last" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} />
        );

        return items;
    };

    if (totalPages <= 1) return null;

    return (
        <BootstrapPagination>{getPageItems()}</BootstrapPagination>
    );
};

export default Pagination; 