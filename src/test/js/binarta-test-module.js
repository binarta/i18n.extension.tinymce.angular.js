// (function () {
//     angular.module('binarta-applicationjs-gateways-angular1', ['binarta-applicationjs-inmem-angular1'])
//         .provider('binartaApplicationGateway', ['inmemBinartaApplicationGatewayProvider', proxy]);
//
//     function proxy(gateway) {
//         return gateway;
//     }
// })();



(function () {
    angular.module('binarta-checkpointjs-gateways-angular1', ['binarta-checkpointjs-inmem-angular1'])
        .provider('binartaCheckpointGateway', ['inmemBinartaCheckpointGatewayProvider', proxy]);

    angular.module('binartajs-angular1-spec', [
        'binarta-checkpointjs-angular1', 'binarta-checkpointjs-gateways-angular1'
    ]);

    function proxy(gateway) {
        return gateway;
    }
})();
