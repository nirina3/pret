import React, { useState, useEffect } from 'react';
import { PlusCircle, DollarSign, Calendar, User, Search, Bitcoin, Mail, Bell, AlertCircle, CreditCard, History, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  date: Date;
  type: 'full' | 'partial';
}

interface Loan {
  id: string;
  borrowerName: string;
  borrowerEmail: string;
  lenderEmail: string;
  amount: number;
  interestRate: number;
  interestAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'overdue';
  monthlyPayment: number;
  usdtAmount?: number;
  usdtRate?: number;
  cryptoTxRef?: string;
  payments?: Payment[];
  totalPaid?: number;
  remainingAmount?: number;
}

function App() {
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      borrowerName: 'Jean Dupont',
      borrowerEmail: 'jean.dupont@email.com',
      lenderEmail: 'preteur@email.com',
      amount: 245000000, // 50000 EUR * 4900
      interestRate: 3.5,
      interestAmount: 8575000, // Calculé automatiquement
      startDate: new Date('2024-01-15'),
      endDate: new Date('2029-01-15'),
      status: 'active',
      monthlyPayment: 4410000, // 900 EUR * 4900
      usdtAmount: 50000,
      usdtRate: 4900,
      cryptoTxRef: 'TX123456789',
      payments: [
        { id: '1', amount: 4410000, date: new Date('2024-02-15'), type: 'full' },
        { id: '2', amount: 4410000, date: new Date('2024-03-15'), type: 'full' }
      ],
      totalPaid: 8820000,
      remainingAmount: 244755000
    },
    {
      id: '2',
      borrowerName: 'Marie Martin',
      borrowerEmail: 'marie.martin@email.com',
      lenderEmail: 'preteur@email.com',
      amount: 122500000, // 25000 EUR * 4900
      interestRate: 4.2,
      interestAmount: 5145000, // Calculé automatiquement
      startDate: new Date('2023-06-01'),
      endDate: new Date('2026-06-01'),
      status: 'active',
      monthlyPayment: 3675000, // 750 EUR * 4900
      usdtAmount: 25000,
      usdtRate: 4900,
      cryptoTxRef: 'TX987654321',
      payments: [
        { id: '1', amount: 3675000, date: new Date('2023-07-01'), type: 'full' }
      ],
      totalPaid: 3675000,
      remainingAmount: 124970000
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'full' as 'full' | 'partial'
  });
  const [newLoan, setNewLoan] = useState({
    borrowerName: '',
    borrowerEmail: '',
    lenderEmail: '',
    amount: '',
    interestRate: '',
    interestAmount: '',
    startDate: '',
    endDate: '',
    monthlyPayment: '',
    usdtAmount: '',
    usdtRate: '',
    cryptoTxRef: ''
  });

  const filteredLoans = loans.filter(loan =>
    loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const activeLoans = loans.filter(loan => loan.status === 'active').length;

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} Ar`;
  };

  // Fonction pour formater le montant avec espaces
  const formatAmountInput = (value: string) => {
    // Supprimer tous les espaces et caractères non numériques
    const numericValue = value.replace(/\D/g, '');
    // Ajouter les espaces pour les milliers
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Fonction pour obtenir la valeur numérique pure
  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\s/g, '');
  };

  // Calcul automatique selon la nouvelle formule
  useEffect(() => {
    const amount = getNumericValue(newLoan.amount);
    const rate = newLoan.interestRate;
    const startDate = newLoan.startDate;
    const endDate = newLoan.endDate;

    if (amount && rate) {
      const principal = parseFloat(amount);
      const interestRate = parseFloat(rate);
      
      // Nouvelle formule : Montant de taux d'intérêt = (Montant × Taux d'intérêt) / 100
      const interestAmount = (principal * interestRate) / 100;
      
      setNewLoan(prev => ({
        ...prev,
        interestAmount: Math.round(interestAmount).toLocaleString('fr-FR')
      }));

      // Calcul de la mensualité si les dates sont disponibles
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
        
        if (months > 0) {
          // Mensualité = (Montant + Intérêts) / Nombre de mois
          const totalAmount = principal + interestAmount;
          const monthlyPayment = totalAmount / months;
          
          setNewLoan(prev => ({
            ...prev,
            monthlyPayment: Math.round(monthlyPayment).toLocaleString('fr-FR')
          }));
        }
      }
    } else {
      // Réinitialiser si les champs requis ne sont pas remplis
      setNewLoan(prev => ({
        ...prev,
        interestAmount: '',
        monthlyPayment: ''
      }));
    }
  }, [newLoan.amount, newLoan.interestRate, newLoan.startDate, newLoan.endDate]);

  // Calcul automatique du montant USDT
  useEffect(() => {
    const amount = getNumericValue(newLoan.amount);
    const usdtRate = newLoan.usdtRate;

    if (amount && usdtRate) {
      const principal = parseFloat(amount);
      const rate = parseFloat(usdtRate);
      
      // Montant USDT = Montant Ariary / Cours USDT
      const usdtAmount = principal / rate;
      
      setNewLoan(prev => ({
        ...prev,
        usdtAmount: usdtAmount.toFixed(2)
      }));
    } else if (!usdtRate) {
      setNewLoan(prev => ({
        ...prev,
        usdtAmount: ''
      }));
    }
  }, [newLoan.amount, newLoan.usdtRate]);

  const handleAmountChange = (value: string) => {
    const formatted = formatAmountInput(value);
    setNewLoan(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  const handlePaymentAmountChange = (value: string) => {
    const formatted = formatAmountInput(value);
    setNewPayment(prev => ({
      ...prev,
      amount: formatted
    }));
  };

  // Fonction pour envoyer des notifications par e-mail (version mock pour la démo)
  const sendEmailNotification = async (loan: Loan, type: 'creation' | 'reminder') => {
    try {
      // Pour la démo, on simule l'envoi d'email
      console.log('📧 Simulation d\'envoi d\'email:', {
        type: type === 'creation' ? 'Création de prêt' : 'Rappel de paiement',
        borrower: {
          name: loan.borrowerName,
          email: loan.borrowerEmail,
          amount: formatCurrency(loan.amount),
          monthlyPayment: formatCurrency(loan.monthlyPayment)
        },
        lender: {
          email: loan.lenderEmail
        }
      });

      // Simulation d'un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Notifications simulées envoyées avec succès');
      
      // Note: Pour utiliser EmailJS en production, vous devez :
      // 1. Créer un compte sur https://www.emailjs.com/
      // 2. Configurer un service email
      // 3. Créer des templates d'email
      // 4. Remplacer les valeurs ci-dessous par vos vraies clés :
      /*
      const serviceID = 'your_actual_service_id';
      const templateID = type === 'creation' ? 'your_creation_template_id' : 'your_reminder_template_id';
      const userID = 'your_actual_public_key';
      
      await emailjs.send(serviceID, templateID, emailParams, userID);
      */
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      // En cas d'erreur, on continue sans bloquer l'application
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmAddLoan = async () => {
    const totalAmount = parseFloat(getNumericValue(newLoan.amount)) + parseFloat(getNumericValue(newLoan.interestAmount));
    
    const loan: Loan = {
      id: Date.now().toString(),
      borrowerName: newLoan.borrowerName,
      borrowerEmail: newLoan.borrowerEmail,
      lenderEmail: newLoan.lenderEmail,
      amount: parseFloat(getNumericValue(newLoan.amount)),
      interestRate: parseFloat(newLoan.interestRate),
      interestAmount: parseFloat(getNumericValue(newLoan.interestAmount)),
      startDate: new Date(newLoan.startDate),
      endDate: new Date(newLoan.endDate),
      status: 'active',
      monthlyPayment: parseFloat(getNumericValue(newLoan.monthlyPayment)),
      usdtAmount: newLoan.usdtAmount ? parseFloat(newLoan.usdtAmount) : undefined,
      usdtRate: newLoan.usdtRate ? parseFloat(newLoan.usdtRate) : undefined,
      cryptoTxRef: newLoan.cryptoTxRef || undefined,
      payments: [],
      totalPaid: 0,
      remainingAmount: totalAmount
    };
    
    setLoans([...loans, loan]);
    
    // Envoyer les notifications par e-mail (version simulée)
    await sendEmailNotification(loan, 'creation');
    
    // Réinitialiser le formulaire
    setNewLoan({
      borrowerName: '',
      borrowerEmail: '',
      lenderEmail: '',
      amount: '',
      interestRate: '',
      interestAmount: '',
      startDate: '',
      endDate: '',
      monthlyPayment: '',
      usdtAmount: '',
      usdtRate: '',
      cryptoTxRef: ''
    });
    
    setShowAddForm(false);
    setShowConfirmation(false);
    alert('Prêt créé avec succès ! (Notifications simulées - voir la console pour les détails)');
  };

  const sendPaymentReminder = async (loan: Loan) => {
    await sendEmailNotification(loan, 'reminder');
    alert('Rappel de paiement simulé envoyé ! (Voir la console pour les détails)');
  };

  const handleAddPayment = () => {
    if (!selectedLoanForPayment || !newPayment.amount) return;

    const paymentAmount = parseFloat(getNumericValue(newPayment.amount));
    const payment: Payment = {
      id: Date.now().toString(),
      amount: paymentAmount,
      date: new Date(newPayment.date),
      type: newPayment.type
    };

    const updatedLoans = loans.map(loan => {
      if (loan.id === selectedLoanForPayment.id) {
        const newPayments = [...(loan.payments || []), payment];
        const newTotalPaid = (loan.totalPaid || 0) + paymentAmount;
        const totalLoanAmount = loan.amount + loan.interestAmount;
        const newRemainingAmount = totalLoanAmount - newTotalPaid;
        
        return {
          ...loan,
          payments: newPayments,
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newRemainingAmount <= 0 ? 'completed' as const : loan.status
        };
      }
      return loan;
    });

    setLoans(updatedLoans);
    setNewPayment({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'full'
    });
    setShowPaymentModal(false);
    setSelectedLoanForPayment(null);
    alert('Paiement enregistré avec succès !');
  };

  const openPaymentModal = (loan: Loan) => {
    setSelectedLoanForPayment(loan);
    setNewPayment({
      amount: loan.monthlyPayment.toLocaleString('fr-FR'),
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'full'
    });
    setShowPaymentModal(true);
  };

  const openPaymentHistory = (loan: Loan) => {
    setSelectedLoanForPayment(loan);
    setShowPaymentHistory(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'completed': return 'Terminé';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestion de Prêts</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusCircle size={20} />
              Nouveau Prêt
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Montant Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="text-green-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Prêts Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{activeLoans}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="text-purple-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total Prêts</p>
                  <p className="text-2xl font-bold text-purple-600">{loans.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom d'emprunteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emprunteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant (Ariary)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intérêts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USDT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensualité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payé / Restant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loan.borrowerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {loan.borrowerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(loan.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{loan.interestRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(loan.interestAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Bitcoin size={16} className="text-orange-500" />
                        {loan.usdtAmount ? `${loan.usdtAmount.toLocaleString('fr-FR')} USDT` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(loan.monthlyPayment)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <div className="text-green-600">Payé: {formatCurrency(loan.totalPaid || 0)}</div>
                        <div className="text-orange-600">Restant: {formatCurrency(loan.remainingAmount || (loan.amount + loan.interestAmount))}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {getStatusText(loan.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => sendPaymentReminder(loan)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                          title="Envoyer un rappel de paiement"
                        >
                          <Bell size={14} />
                          Rappel
                        </button>
                        <button
                          onClick={() => openPaymentModal(loan)}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs"
                          title="Enregistrer un paiement"
                        >
                          <CreditCard size={14} />
                          Paiement
                        </button>
                        <button
                          onClick={() => openPaymentHistory(loan)}
                          className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-xs"
                          title="Voir l'historique des paiements"
                        >
                          <History size={14} />
                          Historique
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Loan Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Nouveau Prêt</h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informations personnelles */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="text-blue-500" size={20} />
                      Informations Personnelles
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'emprunteur
                    </label>
                    <input
                      type="text"
                      required
                      value={newLoan.borrowerName}
                      onChange={(e) => setNewLoan({...newLoan, borrowerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail de l'emprunteur
                    </label>
                    <input
                      type="email"
                      required
                      value={newLoan.borrowerEmail}
                      onChange={(e) => setNewLoan({...newLoan, borrowerEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="emprunteur@email.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail du prêteur
                    </label>
                    <input
                      type="email"
                      required
                      value={newLoan.lenderEmail}
                      onChange={(e) => setNewLoan({...newLoan, lenderEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="preteur@email.com"
                    />
                  </div>

                  {/* Informations financières */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="text-green-500" size={20} />
                      Informations Financières
                    </h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (Ariary)
                    </label>
                    <input
                      type="text"
                      required
                      value={newLoan.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: 5 000 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux d'intérêt (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newLoan.interestRate}
                      onChange={(e) => setNewLoan({...newLoan, interestRate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: 5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant de taux d'intérêt (Ariary) - Calculé automatiquement
                    </label>
                    <input
                      type="text"
                      value={newLoan.interestAmount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      readOnly
                      placeholder="Sera calculé automatiquement"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formule : (Montant × Taux) ÷ 100
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      required
                      value={newLoan.startDate}
                      onChange={(e) => setNewLoan({...newLoan, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      required
                      value={newLoan.endDate}
                      onChange={(e) => setNewLoan({...newLoan, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensualité (Ariary) - Calculé automatiquement
                    </label>
                    <input
                      type="text"
                      value={newLoan.monthlyPayment}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      readOnly
                      placeholder="Sera calculé automatiquement"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formule : (Montant + Intérêts) ÷ Nombre de mois
                    </p>
                  </div>

                  {/* Section Crypto */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Bitcoin className="text-orange-500" size={20} />
                      Informations Crypto
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cours USDT (en Ariary)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newLoan.usdtRate}
                      onChange={(e) => setNewLoan({...newLoan, usdtRate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: 4900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant équivalent en USDT - Calculé automatiquement
                    </label>
                    <input
                      type="text"
                      value={newLoan.usdtAmount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      readOnly
                      placeholder="Sera calculé automatiquement"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formule : Montant Ariary ÷ Cours USDT
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Référence de transaction crypto
                    </label>
                    <input
                      type="text"
                      value={newLoan.cryptoTxRef}
                      onChange={(e) => setNewLoan({...newLoan, cryptoTxRef: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: 0x1234567890abcdef..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={16} />
                    Vérifier et Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal - Z-INDEX PLUS ÉLEVÉ */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-500" size={24} />
                Confirmation des données
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Veuillez vérifier l'exactitude de toutes les données saisies avant la validation finale :</strong>
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Emprunteur :</span> {newLoan.borrowerName}
                  </div>
                  <div>
                    <span className="font-medium">E-mail emprunteur :</span> {newLoan.borrowerEmail}
                  </div>
                  <div>
                    <span className="font-medium">E-mail prêteur :</span> {newLoan.lenderEmail}
                  </div>
                  <div>
                    <span className="font-medium">Montant :</span> {newLoan.amount} Ar
                  </div>
                  <div>
                    <span className="font-medium">Taux d'intérêt :</span> {newLoan.interestRate}%
                  </div>
                  <div>
                    <span className="font-medium">Montant d'intérêt :</span> {newLoan.interestAmount} Ar
                  </div>
                  <div>
                    <span className="font-medium">Mensualité :</span> {newLoan.monthlyPayment} Ar
                  </div>
                  <div>
                    <span className="font-medium">Période :</span> {newLoan.startDate} au {newLoan.endDate}
                  </div>
                  {newLoan.usdtAmount && (
                    <div>
                      <span className="font-medium">Montant USDT :</span> {newLoan.usdtAmount} USDT
                    </div>
                  )}
                  {newLoan.usdtRate && (
                    <div>
                      <span className="font-medium">Cours USDT :</span> {newLoan.usdtRate} Ar
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmAddLoan}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  Confirmer et Créer le Prêt
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedLoanForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="text-green-500" size={24} />
                Enregistrer un Paiement
              </h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Emprunteur :</strong> {selectedLoanForPayment.borrowerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Mensualité prévue :</strong> {formatCurrency(selectedLoanForPayment.monthlyPayment)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Montant restant :</strong> {formatCurrency(selectedLoanForPayment.remainingAmount || (selectedLoanForPayment.amount + selectedLoanForPayment.interestAmount))}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant reçu (Ariary)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPayment.amount}
                    onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: 4 410 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de réception
                  </label>
                  <input
                    type="date"
                    required
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de paiement
                  </label>
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({...newPayment, type: e.target.value as 'full' | 'partial'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full">Paiement complet</option>
                    <option value="partial">Paiement partiel</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Enregistrer le Paiement
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedLoanForPayment(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Modal */}
        {showPaymentHistory && selectedLoanForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <History className="text-purple-500" size={24} />
                Historique des Paiements
              </h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Emprunteur :</strong> {selectedLoanForPayment.borrowerName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total payé :</strong> {formatCurrency(selectedLoanForPayment.totalPaid || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Montant restant :</strong> {formatCurrency(selectedLoanForPayment.remainingAmount || (selectedLoanForPayment.amount + selectedLoanForPayment.interestAmount))}
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {selectedLoanForPayment.payments && selectedLoanForPayment.payments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLoanForPayment.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {format(payment.date, 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {payment.type === 'full' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle size={12} />
                              Complet
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              <Clock size={12} />
                              Partiel
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Aucun paiement enregistré</p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowPaymentHistory(false);
                    setSelectedLoanForPayment(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;