// 数据存储
let members = [];
let expenses = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initEventListeners();
    renderMembers();
    renderExpenseForm();
    renderExpenses();
});

// 事件监听
function initEventListeners() {
    // 添加成员
    document.getElementById('addMemberBtn').addEventListener('click', addMember);
    document.getElementById('memberName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addMember();
        }
    });

    // 添加消费
    document.getElementById('expenseForm').addEventListener('submit', addExpense);

    // 结算
    document.getElementById('settleBtn').addEventListener('click', settleAccounts);

    // 清空所有
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
}

// 成员管理
function addMember() {
    const nameInput = document.getElementById('memberName');
    const dependentsInput = document.getElementById('memberDependents');
    const name = nameInput.value.trim();
    const dependents = parseInt(dependentsInput.value) || 0;

    if (!name) {
        alert('请输入成员姓名');
        return;
    }

    if (dependents < 0 || dependents > 10) {
        alert('家属数量应在0-10之间');
        return;
    }

    if (members.some(m => m.name === name)) {
        alert('该成员已存在');
        return;
    }

    members.push({
        name: name,
        dependents: dependents
    });
    
    nameInput.value = '';
    dependentsInput.value = '0';
    saveData();
    renderMembers();
    renderExpenseForm();
}

function removeMember(name) {
    members = members.filter(m => m.name !== name);
    // 同时删除相关的消费记录
    expenses = expenses.filter(e => e.payer !== name && !e.participants.includes(name));
    saveData();
    renderMembers();
    renderExpenseForm();
    renderExpenses();
}

function renderMembers() {
    const container = document.getElementById('memberList');
    if (members.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无成员，请先添加成员</div>';
        return;
    }

    container.innerHTML = members.map(member => {
        const displayName = member.dependents > 0 
            ? `${escapeHtml(member.name)}（带${member.dependents}人）` 
            : escapeHtml(member.name);
        return `
            <div class="member-tag">
                <span>${displayName}</span>
                <span class="remove" onclick="removeMember('${escapeHtml(member.name)}')">×</span>
            </div>
        `;
    }).join('');
}

// 消费记录
function addExpense(e) {
    e.preventDefault();

    if (members.length === 0) {
        alert('请先添加成员');
        return;
    }

    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const payer = document.getElementById('payerSelect').value;
    const participants = Array.from(document.querySelectorAll('#participantList input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    if (!desc) {
        alert('请输入消费项目');
        return;
    }

    if (!amount || amount <= 0) {
        alert('请输入有效的金额');
        return;
    }

    if (!payer) {
        alert('请选择付款人');
        return;
    }

    if (participants.length === 0) {
        alert('请至少选择一个参与人员');
        return;
    }

    expenses.push({
        id: Date.now(),
        desc,
        amount,
        payer,
        participants,
        date: new Date().toLocaleString('zh-CN')
    });

    document.getElementById('expenseForm').reset();
    saveData();
    renderExpenseForm();
    renderExpenses();
}

function removeExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
    renderExpenses();
}

function renderExpenses() {
    const container = document.getElementById('expenseList');
    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无消费记录</div>';
        return;
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    container.innerHTML = `
        <div style="text-align: right; margin-bottom: 10px; font-size: 14px; color: #666;">
            总计: <strong style="color: #667eea; font-size: 16px;">¥${total.toFixed(2)}</strong>
        </div>
        ${expenses.map(expense => {
            // 计算总人头数
            let totalHeadCount = 0;
            expense.participants.forEach(participantName => {
                const member = members.find(m => m.name === participantName);
                if (member) {
                    totalHeadCount += (1 + member.dependents);
                }
            });
            
            // 显示参与人员（带家属信息）
            const participantDisplay = expense.participants.map(p => {
                const member = members.find(m => m.name === p);
                if (member && member.dependents > 0) {
                    return `${escapeHtml(p)}（带${member.dependents}人）`;
                }
                return escapeHtml(p);
            }).join('、');
            
            return `
                <div class="expense-item">
                    <div class="expense-item-header">
                        <span class="expense-item-title">${escapeHtml(expense.desc)}</span>
                        <span class="expense-item-amount">¥${expense.amount.toFixed(2)}</span>
                    </div>
                    <div class="expense-item-info">
                        <span>付款人: ${escapeHtml(expense.payer)}</span>
                        <span>参与: ${participantDisplay}（共${totalHeadCount}人）</span>
                        <span style="font-size: 12px; color: #999;">${expense.date}</span>
                    </div>
                    <div class="expense-item-remove">
                        <button onclick="removeExpense(${expense.id})">删除</button>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

// 渲染消费表单
function renderExpenseForm() {
    if (members.length === 0) {
        document.getElementById('payerSelect').innerHTML = '<option value="">请先添加成员</option>';
        document.getElementById('participantList').innerHTML = '<div class="empty-state">请先添加成员</div>';
        return;
    }

    // 付款人选择
    const payerSelect = document.getElementById('payerSelect');
    payerSelect.innerHTML = '<option value="">请选择付款人</option>' +
        members.map(m => {
            const displayName = m.dependents > 0 
                ? `${escapeHtml(m.name)}（带${m.dependents}人）` 
                : escapeHtml(m.name);
            return `<option value="${escapeHtml(m.name)}">${displayName}</option>`;
        }).join('');

    // 参与人员
    const participantList = document.getElementById('participantList');
    participantList.innerHTML = members.map(m => {
        const displayName = m.dependents > 0 
            ? `${escapeHtml(m.name)}（带${m.dependents}人）` 
            : escapeHtml(m.name);
        return `
            <div class="participant-item">
                <input type="checkbox" id="participant_${escapeHtml(m.name)}" value="${escapeHtml(m.name)}" checked>
                <label for="participant_${escapeHtml(m.name)}">${displayName}</label>
            </div>
        `;
    }).join('');
}

// AA结算算法
function settleAccounts() {
    if (members.length === 0) {
        alert('请先添加成员');
        return;
    }

    if (expenses.length === 0) {
        alert('请先添加消费记录');
        return;
    }

    // 计算每个人的总支出和应支付金额
    const balances = {};
    members.forEach(m => {
        balances[m.name] = {
            paid: 0,      // 已支付
            shouldPay: 0, // 应支付
            headCount: 1 + m.dependents  // 人头数（本人+家属）
        };
    });

    // 统计每个人的支付和应支付
    expenses.forEach(expense => {
        // 计算总人头数
        let totalHeadCount = 0;
        expense.participants.forEach(participantName => {
            const member = members.find(m => m.name === participantName);
            if (member) {
                totalHeadCount += (1 + member.dependents);
            }
        });
        
        if (totalHeadCount === 0) return; // 防止除零
        
        const perHead = expense.amount / totalHeadCount;
        
        // 付款人已支付
        balances[expense.payer].paid += expense.amount;
        
        // 每个参与人按人头数应支付
        expense.participants.forEach(participantName => {
            const member = members.find(m => m.name === participantName);
            if (member) {
                const headCount = 1 + member.dependents;
                balances[participantName].shouldPay += perHead * headCount;
            }
        });
    });

    // 计算净余额（正数表示应收，负数表示应付）
    const netBalances = {};
    members.forEach(m => {
        netBalances[m.name] = balances[m.name].paid - balances[m.name].shouldPay;
    });

    // 生成结算结果
    renderSettlement(balances, netBalances);
}

// 计算每笔消费的转账明细
function calculateExpenseTransfers(expenses) {
    const expenseTransfers = [];
    
    expenses.forEach(expense => {
        // 计算总人头数
        let totalHeadCount = 0;
        expense.participants.forEach(participantName => {
            const member = members.find(m => m.name === participantName);
            if (member) {
                totalHeadCount += (1 + member.dependents);
            }
        });
        
        if (totalHeadCount === 0) return;
        
        const perHead = expense.amount / totalHeadCount;
        
        // 对于每个参与人，如果不是付款人，需要向付款人转账
        expense.participants.forEach(participantName => {
            if (participantName !== expense.payer) {
                const member = members.find(m => m.name === participantName);
                if (member) {
                    const headCount = 1 + member.dependents;
                    const amount = perHead * headCount;
                    if (amount >= 0.01) {
                        expenseTransfers.push({
                            from: participantName,
                            to: expense.payer,
                            amount: amount,
                            expenseDesc: expense.desc
                        });
                    }
                }
            }
        });
    });
    
    return expenseTransfers;
}

// 合并转账（处理双向转账抵消）
function mergeTransfers(expenseTransfers) {
    // 先按方向分组
    const transferMap = {};
    
    expenseTransfers.forEach(transfer => {
        const key = `${transfer.from}_${transfer.to}`;
        if (!transferMap[key]) {
            transferMap[key] = {
                from: transfer.from,
                to: transfer.to,
                amount: 0,
                details: []
            };
        }
        transferMap[key].amount += transfer.amount;
        transferMap[key].details.push({
            desc: transfer.expenseDesc,
            amount: transfer.amount
        });
    });
    
    // 处理双向转账抵消（例如A→B和B→A）
    const finalTransfers = [];
    const processed = new Set();
    
    Object.keys(transferMap).forEach(key => {
        if (processed.has(key)) return;
        
        const transfer = transferMap[key];
        const reverseKey = `${transfer.to}_${transfer.from}`;
        const reverseTransfer = transferMap[reverseKey];
        
        if (reverseTransfer && reverseTransfer.amount > 0) {
            // 存在反向转账，进行抵消
            processed.add(reverseKey);
            
            const netAmount = transfer.amount - reverseTransfer.amount;
            
            if (Math.abs(netAmount) >= 0.01) {
                if (netAmount > 0) {
                    // 正向转账仍有余额
                    finalTransfers.push({
                        from: transfer.from,
                        to: transfer.to,
                        amount: netAmount,
                        details: [
                            ...transfer.details,
                            ...reverseTransfer.details.map(d => ({
                                desc: d.desc,
                                amount: -d.amount
                            }))
                        ]
                    });
                } else {
                    // 反向转账仍有余额
                    finalTransfers.push({
                        from: reverseTransfer.from,
                        to: reverseTransfer.to,
                        amount: -netAmount,
                        details: [
                            ...reverseTransfer.details,
                            ...transfer.details.map(d => ({
                                desc: d.desc,
                                amount: -d.amount
                            }))
                        ]
                    });
                }
            }
        } else {
            // 没有反向转账，直接添加
            finalTransfers.push({
                from: transfer.from,
                to: transfer.to,
                amount: transfer.amount,
                details: transfer.details
            });
        }
        
        processed.add(key);
    });
    
    return finalTransfers;
}

// 渲染结算结果
function renderSettlement(balances, netBalances) {
    const container = document.getElementById('settlementResult');
    
    // 计算汇总
    const summary = members.map(m => ({
        name: m.name,
        displayName: m.dependents > 0 ? `${m.name}（带${m.dependents}人）` : m.name,
        headCount: 1 + m.dependents,
        paid: balances[m.name].paid,
        shouldPay: balances[m.name].shouldPay,
        net: netBalances[m.name]
    }));

    // 计算转账明细（按每笔消费）
    const expenseTransfers = calculateExpenseTransfers(expenses);
    const mergedTransfers = mergeTransfers(expenseTransfers);

    let html = '<div class="settlement-summary">';
    html += '<h3>💰 费用汇总</h3>';
    summary.forEach(item => {
        html += `
            <div class="summary-item">
                <div>
                    <div class="summary-item-name">${escapeHtml(item.displayName)}</div>
                    <div style="font-size: 11px; color: #999; margin-top: 2px;">
                        ${item.headCount}人
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #999;">
                        已付: ¥${item.paid.toFixed(2)} | 应付: ¥${item.shouldPay.toFixed(2)}
                    </div>
                    <span class="summary-item-amount ${item.net >= 0 ? 'positive' : 'negative'}">
                        ${item.net >= 0 ? '应收' : '应付'}: ¥${Math.abs(item.net).toFixed(2)}
                    </span>
                </div>
            </div>
        `;
    });
    html += '</div>';

    if (mergedTransfers.length > 0) {
        html += '<div class="settlement-transfers">';
        html += '<h3>💸 转账方案</h3>';
        mergedTransfers.forEach(transfer => {
            html += `
                <div class="transfer-item">
                    <div style="margin-bottom: 6px;">
                        <strong>${escapeHtml(transfer.from)}</strong> 
                        向 
                        <strong>${escapeHtml(transfer.to)}</strong> 
                        转账 
                        <strong style="color: #eb3349;">¥${transfer.amount.toFixed(2)}</strong>
                    </div>`;
            if (transfer.details.length > 1) {
                html += '<div style="font-size: 11px; color: #999; padding-left: 8px;">';
                transfer.details.forEach(detail => {
                    html += `• ${escapeHtml(detail.desc)}: ¥${detail.amount.toFixed(2)}<br>`;
                });
                html += '</div>';
            }
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="settlement-transfers">';
        html += '<div style="text-align: center; color: #11998e; font-weight: 600;">✅ 费用已平衡，无需转账</div>';
        html += '</div>';
    }

    container.innerHTML = html;
}

// 清空所有数据
function clearAll() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        members = [];
        expenses = [];
        saveData();
        renderMembers();
        renderExpenseForm();
        renderExpenses();
        document.getElementById('settlementResult').innerHTML = '';
    }
}

// 数据持久化
function saveData() {
    localStorage.setItem('aa_accounting_members', JSON.stringify(members));
    localStorage.setItem('aa_accounting_expenses', JSON.stringify(expenses));
}

function loadData() {
    const savedMembers = localStorage.getItem('aa_accounting_members');
    const savedExpenses = localStorage.getItem('aa_accounting_expenses');
    
    if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        // 兼容旧数据格式（字符串数组）
        if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof parsed[0] === 'string') {
                // 旧格式：字符串数组，转换为新格式
                members = parsed.map(name => ({ name, dependents: 0 }));
            } else {
                // 新格式：对象数组
                members = parsed;
            }
        } else {
            members = parsed;
        }
    }
    
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 暴露给全局作用域（用于onclick）
window.removeMember = removeMember;
window.removeExpense = removeExpense;

