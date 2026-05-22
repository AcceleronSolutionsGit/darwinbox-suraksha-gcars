import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function QuarterlyBudgets() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState('IT'); // 'IT' or 'Tools'
  
  const [budgets, setBudgets] = useState({ Q1: '', Q2: '', Q3: '', Q4: '' });
  const [overflows, setOverflows] = useState({ Q1: false, Q2: false, Q3: false, Q4: false });
  const [ratios, setRatios] = useState([]);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [globalAmount, setGlobalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [year, category]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        api.get(`/masters/quarterly-budgets?year=${year}&category=${category}`),
        api.get(`/masters/quarterly-budget-ratios?year=${year}&category=${category}`)
      ]);
      
      const newBudgets = { Q1: '', Q2: '', Q3: '', Q4: '' };
      const newOverflows = { Q1: false, Q2: false, Q3: false, Q4: false };
      bRes.data.data.forEach(b => {
        newBudgets[b.quarter] = b.amount;
        newOverflows[b.quarter] = b.allow_overflow === 1;
      });
      setBudgets(newBudgets);
      setOverflows(newOverflows);
      
      setRatios(rRes.data.data || []);
      setTotalAllocated(rRes.data.totalAllocated || 0);
      setGlobalAmount(rRes.data.globalAmount || 0);
    } catch (err) {
      toast.error('Failed to load quarterly budgets');
    } finally {
      setLoading(false);
    }
  };

  const saveQuarter = async (quarter) => {
    try {
      const allBudgets = { ...budgets, [quarter]: Number(budgets[quarter] || 0) };
      const sum = Object.values(allBudgets).reduce((acc, curr) => acc + Number(curr || 0), 0);
      
      if (sum > totalAllocated && totalAllocated > 0) {
        toast.error(`Total quarterly budgets (₹${fmt(sum)}) cannot exceed yearly allocation (₹${fmt(totalAllocated)}). Remaining: ₹${fmt(totalAllocated - (sum - Number(budgets[quarter] || 0)))}`);
        return;
      }

      await api.post('/masters/quarterly-budgets', {
        year,
        quarter,
        category,
        amount: Number(budgets[quarter] || 0),
        allow_overflow: overflows[quarter]
      });
      toast.success(`${quarter} budget for ${category} saved!`);
      loadBudgets(); // reload ratios
    } catch (err) {
      toast.error(`Failed to save ${quarter} budget`);
    }
  };

  const fmt = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  
  const currentSum = Object.values(budgets).reduce((acc, curr) => acc + Number(curr || 0), 0);
  const remainingBudget = totalAllocated > 0 ? (totalAllocated - currentSum) : 0;

  return (
    <div className="page-content fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="kicker">Masters</div>
          <h1 className="page-title">Quarterly Budget Controls</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Select Year</label>
          <input 
            type="number" 
            className="form-control" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ width: '120px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className={`btn ${category === 'IT' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setCategory('IT')}
          style={{ padding: '8px 24px' }}
        >
          IT Quarterly Budget
        </button>
        <button 
          className={`btn ${category === 'Tools' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setCategory('Tools')}
          style={{ padding: '8px 24px' }}
        >
          Tools Quarterly Budget
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600 }}>
          Yearly Budget: ₹{fmt(totalAllocated)} | Remaining: <span style={{ color: remainingBudget < 0 ? 'var(--coral)' : 'var(--primary)' }}>₹{fmt(remainingBudget)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
          <div key={q} className="card" style={{ padding: '24px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '18px', margin: 0 }}>{q} Budget</h3>
               <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: '4px' }}>
                 <input type="checkbox" checked={overflows[q]} onChange={(e) => setOverflows({ ...overflows, [q]: e.target.checked })} />
                 Allow Overflow
               </label>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="number" 
                className="form-control" 
                value={budgets[q]} 
                onChange={(e) => setBudgets({ ...budgets, [q]: e.target.value })}
                placeholder="Amount (₹)"
              />
              <button className="btn btn-primary" onClick={() => saveQuarter(q)}>Save</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '32px', background: 'var(--bg-card)' }}>
        {category === 'IT' ? (
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>IT Budget Overview (Year {year})</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              IT budgets are managed as a single global pool without individual allocation breakdowns.<br/>
              Total Allocated for all IT: <strong>₹{fmt(totalAllocated)}</strong> <br/>
              Total quarterly amount: <strong>₹{fmt(globalAmount)}</strong>
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{category} Allocation Breakdown (Year {year})</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Total Allocated for all {category}: <strong>₹{fmt(totalAllocated)}</strong> <br/>
                Total quarterly amount: <strong>₹{fmt(globalAmount)}</strong>
              </p>
            </div>

            {loading ? (
              <div>Loading breakdown...</div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Allocation Entity</th>
                      <th>Asset Type</th>
                      <th style={{ textAlign: 'right' }}>Yearly Allocated</th>
                      <th style={{ textAlign: 'right' }}>Ratio</th>
                      <th style={{ textAlign: 'right' }}>Total Quarterly Limit (Yr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratios.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No {category} allocations found for this year.</td>
                      </tr>
                    ) : ratios.map(r => (
                      <tr key={r.id}>
                        <td>{r.entity_name}</td>
                        <td>{r.asset_name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>₹{fmt(r.budgeted_amount)}</td>
                        <td style={{ textAlign: 'right' }}>{(r.ratio * 100).toFixed(2)}%</td>
                        <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>₹{fmt(r.quarterly_limit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
