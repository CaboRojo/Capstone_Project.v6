from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, Column, Integer, String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.schema import Sequence


#Base = declarative_base()

db = SQLAlchemy()   

class User(db.Model):
    __tablename__ = 'USERS'
    ID = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    NAME = Column(String(255))
    HASHED_PASSWORD = Column(String(255))

class Portfolio(db.Model):
    __tablename__ = 'PORTFOLIOS'
    PORTFOLIOID = Column(Integer, Sequence('portfolio_id_seq'), primary_key=True)
    USERID = Column(Integer, ForeignKey('USERS.ID'))
    TOTALPORTFOLIOVALUE = Column(Numeric)
    TOTALROI = Column(Numeric)
    user = relationship("User", back_populates="portfolios")

class Transaction(db.Model):
    __tablename__ = 'TRANSACTIONS'
    TRANSACTIONID = Column(Integer, Sequence('transaction_id_seq'), primary_key=True)
    PORTFOLIOID = Column(Integer, ForeignKey('PORTFOLIOS.PORTFOLIOID'))
    SYMBOL = Column(String(255))
    TRANSACTIONDATE = Column(TIMESTAMP)
    QUANTITY = Column(Integer)
    TRANSACTIONPRICE = Column(Numeric)
    CURRENTTOTALVALUE = Column(Numeric)
    TRANSACTIONTYPE = Column(String(255))
    portfolio = relationship("Portfolio", back_populates="transactions")

class PortfolioDetail(db.Model):
    __tablename__ = 'PORTFOLIODETAILS'
    DETAILID = Column(Integer, Sequence('detail_id_seq'), primary_key=True)
    PORTFOLIOID = Column(Integer, ForeignKey('PORTFOLIOS.PORTFOLIOID'))
    TICKERSYMBOL = Column(String(255))
    QUANTITY = Column(Integer)
    LASTCLOSINGPRICE = Column(Numeric)
    TOTALSTOCKVALUE = Column(Numeric)
    portfolio = relationship("Portfolio", back_populates="details")

class Stock(db.Model):
    __tablename__ = 'STOCKS'
    ID = Column(Integer, Sequence('stock_id_seq'), primary_key=True)
    USER_ID = Column(Integer, ForeignKey('USERS.ID'))
    SYMBOL = Column(String(255))
    SHARES = Column(Integer)
    PURCHASE_PRICE = Column(Numeric)
    user = relationship("User", back_populates="stocks")

# Establish relationships
User.portfolios = relationship("Portfolio", order_by=Portfolio.PORTFOLIOID, back_populates="user")
User.stocks = relationship("Stock", order_by=Stock.ID, back_populates="user")
Portfolio.transactions = relationship("Transaction", order_by=Transaction.TRANSACTIONID, back_populates="portfolio")
Portfolio.details = relationship("PortfolioDetail", order_by=PortfolioDetail.DETAILID, back_populates="portfolio")
