import WebSocket from "ws";

export interface wsWithIdx extends WebSocket
{
    id: string;
}