export interface Agent {
    run(args: any): Promise<void>;
}
