import axios from "axios";
import { contractValueTypeMap } from "./constants/contractValueMap";

export let COOKIES:Array<any>;
export let CSRFTOKEN: string = '';

export async function login(token: string): Promise<{ csrfAccessToken: any, cookiesArray: Array<any> }> {
    try {
        const response = await axios.post('https://algotest.in/api/login-google', {
            token: token
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const cookies = response.headers['set-cookie'] || [];
        let csrfAccessToken = '';
        let cookiesArray = [];
        for (const cookie of cookies) {
            const cookieParts = cookie.split(';');
            if (cookieParts.length && cookieParts[0].split('=')[1]?.length > 0){
                cookiesArray.push(cookieParts[0]);
            }
            if (cookie.startsWith('csrf_access_token=')) {
                csrfAccessToken = cookie.split(';')[0].split('=')[1]; // Extract the value
                if (csrfAccessToken.length > 0) break; // Exit the loop once the token is found
            }
        }
        COOKIES  = cookiesArray;
        CSRFTOKEN = csrfAccessToken;
        return { csrfAccessToken, cookiesArray };
    } catch (error) {
        throw error
    }
}

export async function runBacktest(strategy: any) {
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjVhYWZmNDdjMjFkMDZlMjY2Y2NlMzk1YjIxNDVjN2M2ZDQ3MzBlYTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3NDgwOTM2NzM4ODctMmY2NDVlaTFuOHFzdWJzcWdzOXNtOWI3ZDRoZzB1NGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3NDgwOTM2NzM4ODctMmY2NDVlaTFuOHFzdWJzcWdzOXNtOWI3ZDRoZzB1NGEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDcyMTc1Mjk5ODM2NTA1NTc1NjkiLCJlbWFpbCI6InJpeWFqbGVhcm5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5iZiI6MTcyNzQ0OTA4MiwibmFtZSI6IlJpeWFKIExlYXJuIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0wzMm9nNFhXaGRCNDNZdi04UGFaTFRkWXgtQVRSQmJ1YWpHZEEtRnp1ZjN6M250ek9rPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlJpeWFKIiwiZmFtaWx5X25hbWUiOiJMZWFybiIsImlhdCI6MTcyNzQ0OTM4MiwiZXhwIjoxNzI3NDUyOTgyLCJqdGkiOiJhOTY5ODQ3MmE4OTBkYWQzNjBhMmUzNjlmMDY4YmUyMjRlNzRhYjZkIn0.N_o_BuY2NEiMipar-makYpDACi_wXBFvbh3QqfKadsnwPRo8P-P9droRqoFx3AGg7ZiQ7rLVvI4VXV4I0uiNvbUoRI7N-v7Nyfy6mDbrqehqzlrtkpj82JEwp_U3nnt4U2GtfTAgovmwNdJt9IwiqmdUqJu_O4J5qjWL1aAyv4MNCOMoBm1AG1nc_Zpq0VS3005OrQAYYei-sUgrFJ-HqGD6OK52g7qcUuysQloklr5ofdyLccUExrcISqBgzMDdXMOk2jj4TWoJt_C3CS3vi-yDMYIaMRFKADTH4cxMig_CDAvlbK2RlHuX0tXVJMHl7HryHw8nxoPtRTZRDiDi6Q'
    console.log(`strategy: ${strategy}`);
    const url = 'https://algotest.in/api/backtest';
    const headers = {
        'X-CSRF-TOKEN-ACCESS': `${CSRFTOKEN}`,
        'Content-Type': 'application/json',
        'Cookie': COOKIES.join('; ')
    };
    try {
        const response = await axios.post(url, strategy, { headers });
        return response.data;
    } catch (error: any) {
        throw error;
    }
}

export function transformStrategy(strategy: any) {
    const symbol = strategy.asset.symbol;
    const lotSize = strategy.lot_size;
    const stopLossValue = strategy.risk_management.stop_loss.value;
    const takeProfitValue = strategy.risk_management.take_profit.value;
    const entryTime = strategy.entry_trigger.value.split(':');
    const exitTime = strategy.exit_time.split(':');
    const contractValueType: string = strategy.contract_value.type;
    const entryType = contractValueTypeMap.get(contractValueType)
    const strikeParameter = strategy.contract_value.value;

    const output = {
        strategy_id: null,
        name: strategy.strategy_name || "Unsaved Strategy",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        strategy: {
            Ticker: symbol,
            TakeUnderlyingFromCashOrNot: "True", // Assuming this is always true
            TrailSLtoBreakeven: "False", // As per the given output
            SquareOffAllLegs: "False", // As per the given output
            EntryIndicators: {
                Type: "IndicatorTreeNodeType.OperandNode",
                OperandType: "OperandType.And",
                Value: [
                    {
                        Type: "IndicatorTreeNodeType.DataNode",
                        Value: {
                            IndicatorName: "IndicatorType.TimeIndicator",
                            Parameters: {
                                Hour: parseInt(entryTime[0], 10),
                                Minute: parseInt(entryTime[1], 10),
                            }
                        }
                    }
                ]
            },
            ExitIndicators: {
                Type: "IndicatorTreeNodeType.OperandNode",
                OperandType: "OperandType.And",
                Value: [
                    {
                        Type: "IndicatorTreeNodeType.DataNode",
                        Value: {
                            IndicatorName: "IndicatorType.TimeIndicator",
                            Parameters: {
                                Hour: parseInt(exitTime[0], 10),
                                Minute: parseInt(exitTime[1], 10),
                            }
                        }
                    }
                ]
            },
            StrategyType: "StrategyType.IntradaySameDay", // Assuming the strategy is intraday
            MaxPositionInADay: 1, // As per the given output
            ReentryTimeRestriction: "None", // As per the given output
            ListOfLegConfigs: [
                {
                    PositionType: strategy.actions.entry === "sell" ? "PositionType.Sell" : "PositionType.Buy",
                    Lots: lotSize,
                    LegStopLoss: {
                        Type: "LegTgtSLType.Percentage",
                        Value: stopLossValue
                    },
                    LegTarget: {
                        Type: "LegTgtSLType.Percentage",
                        Value: takeProfitValue
                    },
                    LegTrailSL: {
                        Type: "None",
                        Value: {}
                    },
                    LegMomentum: {
                        Type: "None",
                        Value: 0
                    },
                    ExpiryKind: strategy.asset.expiry.frequency === "weekly" ? "ExpiryType.Weekly" : "ExpiryType.Monthly",
                    EntryType: `${entryType}`,
                    StrikeParameter: strikeParameter,
                    InstrumentKind: strategy.asset.type[0] === "CE" ? "LegType.CE" : "LegType.PE",
                    LegReentrySL: {
                        Type: "None",
                        Value: {}
                    },
                    LegReentryTP: {
                        Type: "None",
                        Value: {}
                    },
                    id: "leg1"
                },
                {
                    PositionType: strategy.actions.entry === "sell" ? "PositionType.Sell" : "PositionType.Buy",
                    Lots: lotSize,
                    LegStopLoss: {
                        Type: "LegTgtSLType.Percentage",
                        Value: stopLossValue
                    },
                    LegTarget: {
                        Type: "LegTgtSLType.Percentage",
                        Value: takeProfitValue
                    },
                    LegTrailSL: {
                        Type: "None",
                        Value: {}
                    },
                    LegMomentum: {
                        Type: "None",
                        Value: 0
                    },
                    ExpiryKind: strategy.asset.expiry.frequency === "weekly" ? "ExpiryType.Weekly" : "ExpiryType.Monthly",
                    EntryType:`${entryType}`,
                    StrikeParameter: strikeParameter,
                    InstrumentKind: strategy.asset.type[1] === "PE" ? "LegType.PE" : "LegType.CE",
                    LegReentrySL: {
                        Type: "None",
                        Value: {}
                    },
                    LegReentryTP: {
                        Type: "None",
                        Value: {}
                    },
                    id: "leg2"
                }
            ],
            IdleLegConfigs: {},
            OverallSL: {
                Type: "None",
                Value: 0
            },
            OverallTgt: {
                Type: "None",
                Value: 0
            },
            OverallReentrySL: {
                Type: "None",
                Value: {}
            },
            OverallReentryTgt: {
                Type: "None",
                Value: {}
            },
            OverallTrailSL: {
                Type: "None",
                Value: {}
            },
            LockAndTrail: {
                Type: "None",
                Value: {}
            }
        },
        attributes: {
            template: strategy.strategy_name === "Options Buying Strategy" ? "Straddle920" : "",
            positional: "False"
        }
    };

    return output;
}

export async function getBacktestResults(backtestId: string) {
    const url = `https://algotest.in/api/backtest/${backtestId}`;
    try {
        const response = await axios.get(url, {
     headers :{
        'X-CSRF-TOKEN-ACCESS': `${CSRFTOKEN}`,
        'Content-Type': 'application/json',
        'Cookie': COOKIES.join('; ')
    }
        });
        response.data.graph = compute_graph(response.data?.results?.trade_wise_results);
        return response.data;
    } catch (error) {
        // throw error;
    }
}

function compute_graph(data: any) {
    const graph = [];
    let previousSum = 0;
    for (let i = 0; i < data.length; i++) {
        const row = [];
        const data_value = data[i][6]
        row.push(data[i][0]);
        const data_point_1 = (data_value[0][0] - data_value[0][1]) * data_value[0][2];
        const data_point_2 = (data_value[1][0] - data_value[1][1]) * data_value[1][2];
        row.push(previousSum + data_point_1 + data_point_2);
        graph.push(row);
        previousSum = previousSum + data_point_1 + data_point_2;
    }
    return graph;
}