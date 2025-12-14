/* eslint-disable react-refresh/only-export-components */
import { Stack, Chip } from '@mui/material';
import { ErrorSharp } from '@mui/icons-material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ConstructionIcon from '@mui/icons-material/Construction';
import PanToolIcon from '@mui/icons-material/PanTool';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQuery } from '@tanstack/react-query';
import DBModel from '../../model';
import type { Transaction, TransactionDetails } from '../../model';
import { getBikeSalesColumnDefs } from './BikeSalesColumns';
import type { IRow } from './TransactionsTable.types';
import type { ICellRendererParams, ColDef } from 'ag-grid-community';

export function buildColDefs(viewType: string, isMobile: boolean) {
    if (viewType === 'retrospec') {
        try {
            const bikeSalesColumns = getBikeSalesColumnDefs();
            if (bikeSalesColumns && Array.isArray(bikeSalesColumns) && bikeSalesColumns.length > 0) {
                if (isMobile) {
                    return bikeSalesColumns.map((col) => {
                        if (col.colId === 'Bike' || col.colId === 'submitted') {
                            return { ...col, hide: true } as ColDef<IRow>;
                        }
                        return col as ColDef<IRow>;
                    });
                }

                const validColumns = bikeSalesColumns.filter((col) => col && typeof col === 'object');
                if (validColumns.length === bikeSalesColumns.length) {
                    return validColumns as ColDef<IRow>[];
                }
                console.warn('Some bike sales columns are invalid, falling back to default columns');
            } else {
                console.warn('getBikeSalesColumnDefs returned empty or null, falling back to default columns');
            }
        } catch (error) {
            console.error('Error loading bike sales columns:', error);
        }
    }

    return [
        {
            headerName: '#',
            colId: 'transaction_num',
            valueGetter: (params: ICellRendererParams<IRow>) => params.data?.Transaction.transaction_num,
            filter: true,
        } as ColDef<IRow>,
        {
            headerName: 'Status',
            flex: 1.35,
            valueGetter: (params: ICellRendererParams<IRow>) => {
                const isBeerBike = params.data?.Transaction.is_beer_bike;
                const transaction_type = params.data?.Transaction.transaction_type;
                return {
                    isBeerBike,
                    transaction_type,
                };
            },
            cellRenderer: (params: ICellRendererParams) => {
                const { isBeerBike, transaction_type } = params.value as { isBeerBike?: boolean; transaction_type?: string };
                if (!transaction_type) return null;
                if (transaction_type.toLowerCase() !== 'retrospec') {
                    return (
                        <Stack direction={'row'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%', minHeight: '100%' }}>
                            {transaction_type?.toLowerCase() === 'inpatient' && (
                                <Chip
                                    label="Inpatient"
                                    size="small"
                                    variant="filled"
                                    sx={{ bgcolor: '#1b9e3a', color: '#ffffff', fontWeight: 600, borderRadius: 1 }}
                                />
                            )}
                            {transaction_type?.toLowerCase() === 'outpatient' && (
                                <Chip
                                    label="Outpatient"
                                    size="small"
                                    variant="filled"
                                    sx={{ bgcolor: '#9e9e9e', color: '#ffffff', fontWeight: 600, borderRadius: 1 }}
                                />
                            )}
                            {transaction_type?.toLowerCase() === 'merch' && (
                                <Chip
                                    label="Merch"
                                    size="small"
                                    variant="filled"
                                    sx={{ bgcolor: '#6c757d', color: '#ffffff', fontWeight: 600, borderRadius: 1 }}
                                />
                            )}
                            {isBeerBike && (
                                <Chip
                                    label="Beer Bike"
                                    size="small"
                                    variant="filled"
                                    sx={{ bgcolor: '#07d1c3', color: '#ffffff', fontWeight: 600, borderRadius: 1 }}
                                />
                            )}
                        </Stack>
                    );
                }
                // For retrospec transactions the status cell should not render the default chips (handled elsewhere)
                return null;
            },
        } as ColDef<IRow>,
        {
            headerName: 'Tags',
            flex: 0.6,
            valueGetter: (params: ICellRendererParams<IRow>) => {
                const isWaitEmail = params.data?.Transaction.is_waiting_on_email;
                const isUrgent = params.data?.Transaction.is_urgent;
                const isNuclear = params.data?.Transaction.is_nuclear;
                const isBeerBike = params.data?.Transaction.is_beer_bike;
                const transaction_type = params.data?.Transaction.transaction_type;
                const isWaitingOnParts = (params.data?.OrderRequests?.length ?? 0) > 0;
                const is_completed = params.data?.Transaction.is_completed;
                const refurb = params.data?.Transaction.is_refurb;
                return {
                    isWaitEmail,
                    isUrgent,
                    isNuclear,
                    isBeerBike,
                    transaction_type,
                    isWaitingOnParts,
                    is_completed,
                    refurb,
                };
            },
            cellRenderer: (params: ICellRendererParams) => {
                const {
                    isWaitEmail,
                    isUrgent,
                    isNuclear,
                    transaction_type,
                    isWaitingOnParts,
                    is_completed,
                    refurb,
                } = params.value as {
                    isWaitEmail?: boolean;
                    isUrgent?: boolean;
                    isNuclear?: boolean;
                    transaction_type?: string;
                    isWaitingOnParts?: boolean;
                    is_completed?: boolean;
                    refurb?: boolean;
                };

                if (!transaction_type) return null;

                if (transaction_type.toLowerCase() !== 'retrospec') {
                    return (
                        <Stack direction="row" alignItems="center" spacing={1} style={{ width: '100%', minHeight: '100%' }} justifyContent="flex-start">
                            {isUrgent && !is_completed && <ErrorSharp style={{ color: 'red', marginRight: '5px' }} />}
                            {isWaitingOnParts && !is_completed && <i className="fas fa-wrench" style={{ color: 'orange', marginRight: '5px' }} />}
                            {isNuclear && !is_completed && <i className="fas fa-radiation" style={{ color: 'red', marginRight: '5px' }}></i>}
                            {isWaitEmail && <EmailOutlinedIcon style={{ color: 'red' }} />}
                        </Stack>
                    );
                }
                return (
                    <Stack direction="row" alignItems="center" spacing={1} style={{ width: '100%', minHeight: '100%' }} justifyContent="flex-start">
                        {checkStatusOfRetrospec(refurb, isWaitEmail, is_completed)}
                        {isNuclear && !is_completed && <i className="fas fa-radiation" style={{ color: 'red', marginRight: '5px' }}></i>}
                    </Stack>
                );
            },
        },
        {
            headerName: 'Progress',
            colId: 'progress',
            flex: 1.1,
            filter: false,
            sortable: false,
            suppressMenu: true,
            valueGetter: (params: ICellRendererParams<IRow>) => params.data?.Transaction?.transaction_id,
            cellRenderer: ProgressCellRenderer,
        },
        {
            headerName: 'Name',
            valueGetter: (params: ICellRendererParams<IRow>) => `${params.data?.Customer.first_name} ${params.data?.Customer.last_name}`,
            filter: true,
            hide: isMobile,
            flex: isMobile ? 0 : undefined,
        },
        {
            headerName: 'Bike',
            valueGetter: (params: ICellRendererParams<IRow>) => {
                if (!params.data?.Bike || (params.data?.Bike.make === '' && params.data?.Bike.model === '')) {
                    return '';
                }
                return params.data?.Bike.make + ' ' + params.data?.Bike.model;
            },
        },
        {
            headerName: 'Created',
            colId: 'submitted',
            valueGetter: (params: ICellRendererParams<IRow>) => {
                if (!params.data?.Transaction || params.data?.Transaction.date_created === undefined || params.data?.Transaction.date_created === null) {
                    return '';
                }
                return new Date(params.data?.Transaction.date_created);
            },
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.data?.Transaction || params.data?.Transaction.date_created === undefined || params.data?.Transaction.date_created === null) {
                    return '';
                }
                return timeAgo(new Date(params.data?.Transaction.date_created));
            },
        },
        {
            headerName: 'Time Since Completion',
            colId: 'time_since_completion',
            valueGetter: (params: ICellRendererParams<IRow>) => {
                if (!params.data?.Transaction || params.data?.Transaction.date_completed === undefined || params.data?.Transaction.date_completed === null) {
                    return '';
                }
                return new Date(params.data?.Transaction.date_completed);
            },
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.data?.Transaction || params.data?.Transaction.date_completed === undefined || params.data?.Transaction.date_completed === null) {
                    return '';
                }
                return timeAgo(new Date(params.data?.Transaction.date_completed));
            },
        },
    ];
}

export function timeAgo(input: Date) {
    const date = input;
    const formatter = new Intl.RelativeTimeFormat('en');
    const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['years', 3600 * 24 * 365],
        ['months', 3600 * 24 * 30],
        ['weeks', 3600 * 24 * 7],
        ['days', 3600 * 24],
        ['hours', 3600],
        ['minutes', 60],
        ['seconds', 1],
    ];
    const secondsElapsed = (date.getTime() - Date.now()) / 1000;

    for (const [rangeType, rangeVal] of ranges) {
        if (rangeVal < Math.abs(secondsElapsed)) {
            const delta = secondsElapsed / rangeVal;
            return formatter.format(Math.round(delta), rangeType);
        }
    }
}

export const checkStatusOfRetrospec = (refurb: boolean, email: boolean, completed: boolean) => {
    if (completed) {
        return <MonetizationOnIcon style={{ color: 'green', marginRight: '5px' }} />;
    } else if (email && !refurb) {
        return <PanToolIcon style={{ color: 'red', marginRight: '5px' }} />;
    } else if (refurb) {
        return <ConstructionIcon style={{ color: 'gold', marginRight: '5px' }} />;
    }
    return <LocalShippingIcon style={{ color: 'blue', marginRight: '5px' }} />;
};

export const ProgressCellRenderer = ({ data }: ICellRendererParams) => {
    const transactionId: string | undefined = data?.Transaction?.transaction_id;

    const { data: details, isLoading } = useQuery({
        queryKey: ['transactionDetails', transactionId, 'repair'],
        queryFn: () => (transactionId ? DBModel.fetchTransactionDetails(transactionId, 'repair') : Promise.resolve([])),
        enabled: !!transactionId,
        select: (data) => data as TransactionDetails[],
    });

    if (!transactionId || isLoading) {
        return <div style={{ height: 10 }} />;
    }
    if (!details || details.length === 0) {
        return (
            <Stack direction="row" alignItems="center" spacing={1} style={{ width: '100%', height: '100%' }} justifyContent="center">
                <div style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#e0e0e0', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: '#2e7d32' }} />
                    </div>
                </div>
                <CheckCircleIcon style={{ color: '#2e7d32' }} fontSize="medium" />
            </Stack>
        );
    }

    const total = details.length;
    const completed = details.filter((d: TransactionDetails) => d.completed === true).length;
    const percent = Math.round((completed / total) * 100);

    return (
        <Stack direction="row" alignItems="center" spacing={1} style={{ width: '100%', height: '100%' }} justifyContent="center">
            <div style={{ flexGrow: 1 }}>
                <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#e0e0e0', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#2e7d32' : '#fb8c00' }} />
                </div>
            </div>
            {percent === 100 ? <CheckCircleIcon style={{ color: '#2e7d32' }} fontSize="medium" /> : <span style={{ minWidth: 32 }}>{percent}%</span>}
        </Stack>
    );
};

export function getTransactionRowUrl(transaction: Transaction) {
    if (transaction.transaction_type?.toLowerCase() === 'retrospec') {
        return `/bike-transaction/${transaction.transaction_id}?type=${transaction.transaction_type}`;
    }
    return `/transaction-details/${transaction.transaction_id}?type=${transaction.transaction_type}`;
}

// Helper to handle a row click by delegating to the provided navigate function.
// Exported so it can be tested in isolation without mounting the full grid.
export function handleRowClick(navigate: (url: string) => void, data: IRow | undefined) {
    const txn = data?.Transaction as Transaction | undefined;
    if (!txn) return;
    navigate(getTransactionRowUrl(txn));
}
