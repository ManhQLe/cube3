class Cube3 {
    constructor() {
        this.dset = null;
        this.dims = [];
        this.aggs = [];
        this.rels = [];
        this.rollups = [];
    }

    dim(fx, table, name, compare = Cube3.DEF.defComp) {
        name = (name || ++Cube3.CONV.dimName);
        Cube3.CONV.insertDistinct(this.dims, x => x.name === name, {
            fx,
            table,
            name,
            compare
        });
        return this;
    }

    agg(fx, table, name) {
        name = (name || ++Cube3.CONV.dimName);
        Cube3.CONV.insertDistinct(this.aggs, x => x.name === name, {
            fx,
            table,
            name
        });
        return this;
    }

    rollup(fx, name) {
        name = (name || ++Cube3.CONV.dimName);
        Cube3.CONV.insertDistinct(this.rollups, x => x.name === name, {
            fx,
            name
        });
        return this;
    }

    rel(fx, t1, t2) {
        this.rels.push({
            fx,
            t1,
            t2
        });
        return this;
    }

    data(dset) {
        this.dset = dset;
        return this;
    }

    getDims(dims) {
        const tnames = Object.keys(this.dset);
        const {
            dset
        } = this;
        const dlen = tnames.reduce((a, b) => Math.max(a, dset[b].length), 0);
        const fdims = this.dims.filter(d => dims.indexOf(d.name) >= 0);

        const result = {};

        Cube3.oneLoop([dlen, tnames.length, fdims.length], (idx) => {
            const [i, ni, di] = idx;
            const tname = tnames[ni]
            const tab = dset[tname];
            if (i < tab.length) {

                const d = tab[i];
                const dim = fdims[di];
                if (tname === dim.table) {

                    const facts = result[dim.name] || (result[dim.name] = [])
                    const fact = dim.fx(d);
                    Cube3.CONV.insertDistinct(facts, x => dim.compare(x, fact) === 0, fact);
                }
            }
        })
        return result
    }

    getMeasure(measures, filter = {}) {

        const {
            dims,
            aggs,
            rollups,
            rels,
            dset
        } = this;
        
        const results = {}
        const alltNames = Object.keys(dset);
        const immRelatedTable = [];       
        const filterNames = Object.keys(filter);
        const lut = {
            aggs:{},
            dims:{},
            rollups:{},
            rels:{}
        }

        aggs.forEach(a=>{
            measures.indexOf(a.name)>=0?(lut.aggs[a.name]=a):1
            Cube3.CONV.insertDistinct(immRelatedTable,x=>x===a.table,a.table)
                            
            rels.forEach(r=>{
                if(immRelatedTable.indexOf(r.t1)>=0)
                    Cube3.CONV.insertDistinct(immRelatedTable,x=>x===r.t2,r.t2)
                if(immRelatedTable.indexOf(r.t2)>=0)
                    Cube3.CONV.insertDistinct(immRelatedTable,x=>x===r.t1,r.t1)
            })

        })

        dims.forEach(d=>{            
            filterNames.indexOf(d.name)>=0?(lut.dims[d.name] = d):1;
        })

        

        rollups.forEach(r=>{
            measures.indexOf(r.name)>=0?(lut.rollups[r.name]=r):1
        })
        

        const Lens = immRelatedTable.map(tname=>dset[tname].length);



        Cube3.oneLoop(Lens,function(Idx){
            measures.forEach(m=>{
                const agg = lut.aggs[m]
                const i = immRelatedTable.indexOf(agg.table);
                const idx = Idx[i];
                const d = dset[agg.table][idx];
                const measure = agg.fx(d);
                results[m] = lut.rollups[m].fx(results[m],measure);
            })
        })

        return results;
    }

}

Cube3.oneLoop = function (Lens, fx) {
    var DimLen = Lens.length;
    var Total = DimLen;
    var Granula = [];
    var Idx = [];
    var i = 0,
        r, c;
    var k = 1;
    var inc;

    Lens.forEach(function (l, s) {
        Granula.push(k);
        k *= Lens[DimLen - (s + 1)];
        Idx.push(l);
        Total *= l;
    })
    Granula.reverse();
    while (i < Total) {
        r = Math.floor(i / DimLen);
        c = i % DimLen;
        c == 0 ? k = r : 0;
        Idx[c] = Math.floor(k / Granula[c]);
        k = k % Granula[c];
        (c == DimLen - 1) ? (
            inc = fx(Idx, r, Granula),
            i += (inc ? (inc - 1) * DimLen : 0)
        ) : 0;
        i++;

    }
}

Cube3.gra = function (dims) {
    const g = [];
    let x = 1;
    dims.forEach((l, i) => {
        g.push(x);
        x *= dims[dims.length - (i + 1)]
    })
    return g.reverse();
}

Cube3.dimmap = function (v, gra) {
    let r = 0;
    v.forEach((x, i) => {
        r += x * gra[i]
    })
    return r;
}


Cube3.disect = function (x, gra) {
    const dv = [];
    while (i++ < gra.length) {
        dv.push(Math.floor(x / gra[i]))
        x = x % gra[i];
    }
    return dv;
}

Cube3.CONV = {
    dimName: 0,
    insertDistinct: function (array, findfx, d) {
        !array.find(findfx) &&
            array.push(d);
    }
}

Cube3.DEF = {
    defAgg: (d) => {},
    defComp: (a, b) => a === b ? 0 : (a > b ? -1 : 1)
}

module.exports = Cube3;