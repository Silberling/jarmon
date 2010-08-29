/* Copyright (c) 2010 Richard Wall <richard (at) the-moon.net>
 * See LICENSE for details.
 *
 * Unit tests for Jarmon
 **/

YUI({ logInclude: { TestRunner: true } }).use('console', 'test', function(Y) {
    Y.Test.Runner.add(new Y.Test.Case({
        name: "jarmon.downloadBinary",

        test_urlNotFound: function () {
            /**
             * When url cannot be found, the deferred should errback with status
             * 404.
             **/
            var d = new jarmon.downloadBinary('non-existent-file.html');
            d.addBoth(
                function(self, ret) {
                    self.resume(function() {
                        Y.Assert.isInstanceOf(Error, ret);
                        Y.Assert.areEqual(404, ret.message);
                    });
                }, this);

            this.wait();
        },

        test_urlFound: function () {
            /**
             * When url is found, the deferred should callback with an instance
             * of javascriptrrd.BinaryFile
             **/
            var d = new jarmon.downloadBinary('testfile.bin');
            d.addBoth(
                function(self, ret) {
                    self.resume(function() {
                        Y.Assert.isInstanceOf(BinaryFile, ret);
                        Y.Assert.areEqual(String.fromCharCode(0), ret.getRawData());
                    });
                }, this);

            this.wait();
        }

    }));


    Y.Test.Runner.add(new Y.Test.Case({
        name: "jarmon.RrdQuery",

        setUp: function() {
            this.d = new jarmon.downloadBinary('build/test.rrd')
            .addCallback(
                function(self, binary) {
                    try {
                        return new RRDFile(binary);
                    } catch(e) {
                        console.log(e);
                    }
                }, this)
            .addErrback(
                function(ret) {
                    console.log(ret);
                });
        },

        test_getDataTimeRangeOverlapError: function () {
            /**
             * The starttime must be less than the endtime
             **/
            this.d.addCallback(
                function(self, rrd) {
                    self.resume(function() {
                        var rq = new jarmon.RrdQuery(self.rrd, '');
                        var error = null;
                        try {
                            rq.getData(1, 0);
                        } catch(e) {
                            error = e;
                        }
                        Y.Assert.isInstanceOf(jarmon.TimeRangeError, error);
                    });
                }, this);
            this.wait();
        },

        test_getDataSimple: function () {
            /**
             * The generated rrd file should have values 0-9 at 1s intervals
             * starting at 1980-01-01 00:00:00
             **/
            this.d.addCallback(
                function(self, rrd) {
                    self.resume(function() {
                        var firstUpdate = new Date('1 jan 1980 00:00:00').getTime();
                        var lastUpdate = firstUpdate + 10*1000;
                        Y.Assert.areEqual(
                            lastUpdate/1000, rrd.getLastUpdate());
                        var q = new jarmon.RrdQuery(rrd, '');
                        var data = q.getData(firstUpdate, lastUpdate);
                        Y.Assert.areEqual(
                            0, data.data[0][1]);
                    });
                }, this);
            this.wait();
        },

    }));



    //initialize the console
    var yconsole = new Y.Console({
        newestOnTop: false,
        width:'600px'
    });
    yconsole.render('#log');

    //run all tests
    Y.Test.Runner.run();
});
