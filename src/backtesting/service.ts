import axios from "axios";
import { contractValueTypeMap } from "./constants/contractValueMap";

export let COOKIES: Array<any>;
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
            if (cookieParts.length && cookieParts[0].split('=')[1]?.length > 0) {
                cookiesArray.push(cookieParts[0]);
            }
            if (cookie.startsWith('csrf_access_token=')) {
                csrfAccessToken = cookie.split(';')[0].split('=')[1]; // Extract the value
                if (csrfAccessToken.length > 0) break; // Exit the loop once the token is found
            }
        }
        COOKIES = cookiesArray;
        CSRFTOKEN = csrfAccessToken;
        return { csrfAccessToken, cookiesArray };
    } catch (error) {
        throw error
    }
}

export async function runBacktest(strategy: any) {
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
        console.log(error);
        throw error;
    }
}

export function transformStrategy(strategy: any) {
    const symbol = strategy.asset.symbol;
    const lotSize = strategy.lot_size;
    const stopLossValue = strategy.risk_management.stop_loss.value;
    const takeProfitValue = strategy.risk_management.take_profit.value;
    const entryTime = formatTime(`${strategy.entry_trigger.value}`).split(':');
    const exitTime = formatTime(`${strategy.entry_trigger.value}`).split(':');
    const contractValueType: string = strategy.contract_value.type;
    const entryType = contractValueTypeMap.get(contractValueType.toUpperCase())
    const strikeParameter = getStrikeParameter(strategy.contract_value.value, contractValueType.toUpperCase());
    const output = {
        strategy_id: null,
        name: strategy.strategy_name || "Unsaved Strategy",
        start_date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        strategy: {
            Ticker: symbol,
            TakeUnderlyingFromCashOrNot: "True",
            TrailSLtoBreakeven: "False",
            SquareOffAllLegs: "False",
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
            StrategyType: "StrategyType.IntradaySameDay",
            MaxPositionInADay: 1,
            ReentryTimeRestriction: "None",
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
                    EntryType: `EntryType.${entryType}`,
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
                    EntryType: `EntryType.${entryType}`,
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
            template: "Straddle920",
            positional: "False"
        }
    };
    return output;
}

function formatTime(time: any){
    if (time.length === 4 && !time.includes(':')) {
        return `${time.slice(0, 2)}:${time.slice(2)}`;
    }
    return time; // If time is already in "HH:mm", return as is
};

function getStrikeParameter(contractValue: any, contractType: any) {
    if (contractType === "BETWEEN") {
        return {
            LowerRange: contractValue[0],
            UpperRange: contractValue[1],
        };
    }
    return contractValue;
}

export async function getBacktestResults(backtestId: string) {
    const url = `https://algotest.in/api/backtest/${backtestId}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'X-CSRF-TOKEN-ACCESS': `${CSRFTOKEN}`,
                'Content-Type': 'application/json',
                'Cookie': COOKIES.join('; ')
            }
        });
        response.data.graph = compute_graph(response.data?.results?.trade_wise_results);
        return response.data;
    } catch (error) {
        throw error;
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