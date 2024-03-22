# Import necessary libraries and modules
from models import User, Portfolio, PortfolioDetail, Transaction, Stock, db
from decimal import Decimal  # Imports from models.
import logging  # Facilitates logging of messages of various severity levels.
from datetime import datetime, timedelta  # Used for handling dates and time differences.
import re  # Enables regular expression operations.
import requests  # Simplifies making HTTP requests to external services.
import jwt  # Facilitates encoding, decoding, and validation of JWT tokens.
import oracledb  # Additional Oracle database integration, ensure correct import if repetitive.
import os  # Provides a way of using operating system dependent functionality.
from functools import wraps  # Facilitates the use of decorators.
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError # SQLAlchemy specific exception handling.
from sqlalchemy.orm import joinedload
from sqlalchemy.pool import NullPool
from flask import Flask, jsonify, request, abort, make_response  # Imports from Flask.
from flask_cors import CORS  # Allows handling Cross Origin Resource Sharing (CORS), making cross-origin AJAX possible.
from flask.views import MethodView
import bcrypt  # Provides password hashing functions.
from dotenv import load_dotenv
load_dotenv()  # This loads the env variables from .env file if present


# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

def add_cors_headers(response_or_tuple):
    if isinstance(response_or_tuple, tuple):
        # Assuming the tuple format is (response_body, status_code)
        response_body, status_code = response_or_tuple
        response = make_response(response_body, status_code)
    else:
        response = response_or_tuple

    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# JWT Secret Key Configuration
# Attempt to fetch the JWT secret key from environment variables; use a fallback for development.
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'fallback_secret_key_for_development')

# Authentication Decorator Function
# This decorator is used to ensure that routes are accessible only with a valid JWT token.
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None

        # Attempt to retrieve the JWT token from the Authorization header
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        # If no token is found in the request, return an error response
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403

        try:
            # Decode the token using the secret key to validate it
            jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        except jwt.InvalidTokenError:
            # If token validation fails, return an invalid token error
            return jsonify({'message': 'Token is invalid!'}), 403

        # Proceed with the original function if the token is valid
        return f(*args, **kwargs)
    return decorated_function

# This function extracts and returns the user ID from a provided JWT token.
def get_user_id_from_token(token):
    try:
        decoded_token = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return decoded_token.get("user_id")
    except jwt.ExpiredSignatureError:
        abort(401, 'Token has expired.')  # Handle expired token
    except jwt.InvalidTokenError:
        abort(401, 'Invalid token.')  # Handle invalid token


un = 'DEVELOPER'  # Database username
pw = 'AngeleeRiosRamon1999!'  # Database password - consider using a more secure approach for production
dsn = "(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.eu-madrid-1.oraclecloud.com))(connect_data=(service_name=gd51c296542b64f_version3_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))"


# Create a pool of connnecitons for my database 
pool = oracledb.create_pool(user=un, password=pw, dsn=dsn)

# Configuración de SQLAlchemy para Flask
app.config['SQLALCHEMY_DATABASE_URI'] = f'oracle+oracledb://{un}:{pw}@{dsn}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'creator': pool.acquire,
    'poolclass': NullPool
}
app.config['SQLALCHEMY_ECHO'] = True  # cambiar en prod

# Inicializar la base de datos con la aplicación
db.init_app(app)

def hash_password(plain_text_password):
    """
    Hashes a plaintext password using bcrypt.

    Args:
        plain_text_password (str): The plaintext password to hash.

    Returns:
        str: The hashed password, encoded in utf-8 and suitable for storage in the database.

    This function takes a plaintext password as input, hashes it using bcrypt to ensure security,
    and then returns the hashed password. The bcrypt algorithm automatically handles salt generation
    and storage as part of the hash value, providing strong security against rainbow table and
    brute-force attacks.
    """
    return bcrypt.hashpw(plain_text_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def is_password_valid(password):
    """
    Validates a password against specified criteria.

    Args:
        password (str): The password to validate.

    Returns:
        bool: True if the password meets the criteria, False otherwise.

    The criteria for a valid password in this application are:
    - At least 8 characters long.
    - Contains at least one lowercase letter.
    - Contains at least one uppercase letter.
    - Contains at least one digit.
    - Contains at least one special character (e.g., !@#$%^&*(),.?":{}|<>).

    This function uses regular expressions to check if the provided password meets
    all the above criteria, ensuring a baseline level of password complexity and security.
    """
    return len(password) >= 8 and re.search("[a-z]", password) and re.search("[A-Z]", password) and re.search("[0-9]", password) and re.search("[!@#$%^&*(),.?\":{}|<>]", password)

def check_password(plain_text_password, hashed_password):
    # Check that an unhashed password matches one that has previously been hashed
    if bcrypt.checkpw(plain_text_password.encode('utf-8'), hashed_password.encode('utf-8')):
        return True
    else:
        return False


@app.route('/handle_register', methods=['POST'])
def api_register_user():
    """
    Registers a new user with the provided username and password. Upon successful registration,
    a new portfolio is created for the user, and a JWT token is generated and returned for immediate authentication.
    """
    # Handle preflight request for CORS
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response())
    data = request.json
    name  = data.get('name ')
    password = data.get('password')
    # Check if the username already exists to prevent duplicate registrations.
    existing_user = User.query.filter_by(NAME=name ).first()
    if existing_user:
        return jsonify({"error": "Username already exists."}), 409

    hashed_password = hash_password(password)

    # Create and add the new user to the database.
    new_user = User(NAME=name , HASHED_PASSWORD=hashed_password)
    db.session.add(new_user)
    db.session.flush()  # Flush the session to get the newly created User ID.

    # Create a new portfolio for the user.
    new_portfolio = Portfolio(USERID=new_user.ID, TOTALPORTFOLIOVALUE=0, TOTALROI=0)
    db.session.add(new_portfolio)

    try:
        db.session.commit()
        # Generate a JWT token for the new user.
        token = jwt.encode({
            'user_id': new_user.ID,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, JWT_SECRET_KEY, algorithm="HS256")
        return jsonify({"message": "User registered successfully.", "token": token}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Name  already exists."}), 409
    except Exception as e:
        db.session.rollback()
        logging.error(f"Unexpected error during registration: {e}")
        return jsonify({"error": "Registration failed due to an unexpected error."}), 500
    finally:
        db.session.close()

@app.route("/handle_login", methods=["POST"])
def handle_login():
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response())

    """
    Authenticates a user by their name  and password. If authentication is successful,
    generates and returns a JWT token for the user to use in subsequent authenticated requests.

    Accepts:
        JSON payload with 'name' and 'password'.

    Returns:
        On successful authentication: A JWT token in the response body.
        On failure: An error message indicating either incorrect credentials or a server issue.
    """
    data = request.json
    print(data)
    name  = data.get('name')
    password = data.get('password')

    try:
        # Use direct query on the User model
        user = User.query.filter_by(NAME=name ).first()
        
        # Ensure user exists and password matches
        if user and check_password(password, user.HASHED_PASSWORD,):
            # Generate a JWT token
            token = jwt.encode({
                'user_id': user.ID, 
                'exp': datetime.utcnow() + timedelta(days=1)
            }, JWT_SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                'token': token,
                'userId': user.ID  # Add the user's ID to the response.
            }), 200
        else:
            # Return error if user not found or password does not match
            return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        # Handle potential database errors
        db.session.rollback()
        app.logger.error(f"Database error during login: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/handle_logout', methods=['POST'])
@token_required
def handle_logout():
    """
    Instructs the client to delete the token, effectively logging the user out.
    This endpoint does not perform any server-side token invalidation because JWTs are stateless.
    Token invalidation strategies, like maintaining a token blacklist, can be implemented as needed.
    """
    # This is a placeholder response. The actual logout mechanism should ensure the client deletes the token.
    return jsonify({"message": "Logout successful. Please delete the token client-side."}), 200

class AlphaVantageAPI:
    """
    A class for interacting with the Alpha Vantage API to retrieve stock market data.
    
    Attributes:
        api_key (str): The API key used for authenticating requests to Alpha Vantage.
        base_url (str): The base URL for the Alpha Vantage API endpoints.
    """

    def __init__(self, api_key):
        """
        Initializes the AlphaVantageAPI instance with an API key and sets the base URL.
        
        Args:
            api_key (str): The API key for Alpha Vantage.
        """
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query?"

    def make_request(self, params):
        """
        Makes a request to the Alpha Vantage API with the given parameters.
        
        Args:
            params (dict): The parameters to include in the request.
        
        Returns:
            dict: The JSON response from the API, or None if an error occurs.
        """
        params['apikey'] = self.api_key  # Append the API key to the request parameters
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()  # Raises an HTTPError for bad responses
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error("Request exception: %s", e)
            return None

    def get_stock_final_price(self, symbol):
        """
        Retrieves the most recent closing price for a given stock symbol.
        
        Args:
            symbol (str): The stock symbol to query.
        
        Returns:
            float: The most recent closing price of the stock, or None if not found.
        """
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'outputsize': 'compact'
        }
        data = self.make_request(params)
        if data and 'Time Series (Daily)' in data:
            latest_date = max(data['Time Series (Daily)'].keys())
            return float(data['Time Series (Daily)'][latest_date]["4. close"])
        return None

    def get_historical_stock_prices(self, symbol):
        """
        Fetches historical stock prices for the given symbol for the last year.
        
        Args:
            symbol (str): The stock symbol to query.
        
        Returns:
            dict: A dictionary of historical prices, where keys are dates and values are closing prices.
        """
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'outputsize': 'full'
        }
        data = self.make_request(params)
        if data and 'Time Series (Daily)' in data:
            one_year_ago = datetime.now() - timedelta(days=365)
            one_year_ago_str = one_year_ago.strftime('%Y-%m-%d')
            
            historical_prices = {date: info["4. close"] for date, info in data['Time Series (Daily)'].items() if date >= one_year_ago_str}
            return historical_prices
        return None


ALPHA_VANTAGE_API_KEY = "ZBD3QIPITMQNSPPF"

# Initialize an instance of the AlphaVantageAPI class with your API key
alpha_vantage_api = AlphaVantageAPI(ALPHA_VANTAGE_API_KEY)


class UserPortfolioAPI(MethodView):
    """
    Fetches and returns the portfolio details for a specific user, including total value,
    return on investment (ROI), and details of each stock within the portfolio.
    """
    def options(self, user_id=None):  # Include user_id=None to match the URL rule parameter
        # Create an empty response for the preflight request and add CORS headers
        return add_cors_headers(make_response())
    
    def get(self, user_id):
        """
        Retrieves portfolio information for a specified user ID.
        
        Args:
            user_id (int): The ID of the user whose portfolio information is being requested.
        
        Returns:
            A JSON response containing the portfolio details or an error message.
        """
        try:
            # Fetch the user's portfolio based on the user_id. Utilize eager loading of related entities.
            user_portfolio = Portfolio.query.options(db.joinedload(Portfolio.details)).filter_by(USERID=user_id).first()
            
            if not user_portfolio:
                return jsonify({"error": "Portfolio not found."}), 404

            # Compile details of each stock within the portfolio
            stocks_details = [
                {
                    "symbol": detail.TICKERSYMBOL,
                    "quantity": detail.QUANTITY,
                    "last_closing_price": detail.LASTCLOSINGPRICE,
                    "total_stock_value": detail.TOTALSTOCKVALUE
                }
                for detail in user_portfolio.details
            ]

            # Construct and return the aggregated data
            portfolio_data = {
                "total_portfolio_value": user_portfolio.TOTALPORTFOLIOVALUE,
                "roi": user_portfolio.TOTALROI,
                "stocks_details": stocks_details
            }

            response = jsonify(portfolio_data)
            response = add_cors_headers(response)  # Add the CORS headers to the response
            return response  # Return the response after adding the header
        except Exception as e:
        # Log any errors encountered during the query.
            db.session.rollback()
            app.logger.error(f"Error: {e}")
            response = jsonify({"error": "An error occurred fetching portfolio details."})
            response = add_cors_headers(response)  # Add the CORS headers to the error response
        return response, 500


# Correct way to add a URL rule for a class-based view using MethodView
user_portfolio_view = UserPortfolioAPI.as_view('user_portfolio_api')
app.add_url_rule('/user/<int:user_id>/', view_func=user_portfolio_view, methods=['GET', 'OPTIONS'])

class AssetDetailsAPI(MethodView):
    def options(self, user_id=None):
        return add_cors_headers(make_response())

    def get(self, user_id):
        try:
            portfolio = Portfolio.query.options(db.joinedload(Portfolio.details)).filter_by(USERID=user_id).first()
            if not portfolio:
                return jsonify({"error": "Portfolio not found."}), 404

            total_portfolio_value = portfolio.TOTALPORTFOLIOVALUE
            stocks_details = []

            for detail in portfolio.details:
                # Use Alpha Vantage API to fetch the most recent closing price
                last_closing_price = alpha_vantage_api.get_stock_final_price(detail.TICKERSYMBOL)
                if last_closing_price is None:
                    # Skip this stock if the closing price could not be fetched
                    continue

                # Calculate the value of the stock held by the user
                stock_value = detail.QUANTITY * last_closing_price

                # Calculate what percentage of the portfolio is made up by this stock
                portfolio_percentage = (stock_value / float(total_portfolio_value)) * 100 if total_portfolio_value else 0

                # Placeholder for company_name - Ideally, replace 'Unknown' with actual logic to retrieve company names
                company_names = {
                    "AAPL": "Apple Inc.",
                    "MSFT": "Microsoft"
                    # Add more mappings as required
                } # This should be fetched based on the symbol if available

                stocks_details.append({
                    "symbol": detail.TICKERSYMBOL,
                    "company_name": company_names.get(detail.TICKERSYMBOL, "Unknown"),
                    "quantity": detail.QUANTITY,
                    "portfolio_percentage": portfolio_percentage,
                    "last_closing_price": last_closing_price,
                })

            response = {
                "total_portfolio_value": total_portfolio_value,
                "stocks_details": stocks_details
            }

            return jsonify(response), 200
        except Exception as e:
            logging.error(f"Error fetching asset details: {e}")
            return jsonify({"error": "An error occurred fetching asset details: {str(e)}"}), 500

asset_details_view = AssetDetailsAPI.as_view('asset_details_api')
app.add_url_rule('/assets/<int:user_id>/', view_func=asset_details_view, methods=['GET', 'OPTIONS'])

class StockTransactionAPI(MethodView):
    """
    A view class handling stock transactions, including buying and selling (removing) stock for a user's portfolio.
    """

    def buy_stock(self, user_id, symbol, quantity):
        try:
            user = User.query.filter_by(ID=user_id).first()
            if not user:
                return jsonify({"error": "User not found."}), 404

            portfolio = user.portfolios.first()
            if not portfolio:
                return jsonify({"error": "Portfolio not found."}), 404
            purchase_price = alpha_vantage_api.get_stock_final_price(symbol)

            if purchase_price is None:
                return jsonify({"error": "Failed to retrieve stock price."}), 500

            detail = PortfolioDetail.query.filter_by(
                PORTFOLIOID=portfolio.PORTFOLIOID,
                TICKERSYMBOL=symbol
            ).first()

            if detail:
                detail.QUANTITY += quantity
                detail.TOTALSTOCKVALUE += quantity * purchase_price
            else:
                detail = PortfolioDetail(
                    PORTFOLIOID=portfolio.PORTFOLIOID,
                    TICKERSYMBOL=symbol,
                    QUANTITY=quantity,
                    LASTCLOSINGPRICE=purchase_price,
                    TOTALSTOCKVALUE=quantity * purchase_price
                )
                db.session.add(detail)

            transaction = Transaction(
                PORTFOLIOID=portfolio.PORTFOLIOID,
                SYMBOL=symbol,
                TRANSACTIONDATE=datetime.utcnow(),
                QUANTITY=quantity,
                TRANSACTIONPRICE=purchase_price,
                CURRENTTOTALVALUE=detail.TOTALSTOCKVALUE,
                TRANSACTIONTYPE='buy'
            )
            db.session.add(transaction)

            portfolio.TOTALPORTFOLIOVALUE += quantity * purchase_price

            response = jsonify({"message": "Stock purchase successful."})
            return add_cors_headers(response), 200
        except Exception as e:
            app.logger.error(f"Error: {e}")
            response = jsonify({"error": f"Failed to purchase stock: {e}"})
            return add_cors_headers(response), 500

    def remove_stock(self, user_id, symbol, quantity):
        try:
            portfolio_detail = PortfolioDetail.query.join(Portfolio).filter(
                Portfolio.USERID == user_id,
                PortfolioDetail.TICKERSYMBOL == symbol
            ).one_or_none()

            if not portfolio_detail:
                return jsonify({"error": "Stock not found in portfolio."}), 404

            if quantity <= 0 or quantity > portfolio_detail.QUANTITY:
                return jsonify({"error": "Invalid quantity."}), 400

            portfolio = Portfolio.query.filter_by(USERID=user_id).first()

            updated_total_stock_value = portfolio_detail.TOTALSTOCKVALUE * ((portfolio_detail.QUANTITY - quantity) / portfolio_detail.QUANTITY)

            # Update the quantity and total stock value
            portfolio_detail.QUANTITY -= quantity
            portfolio_detail.TOTALSTOCKVALUE = updated_total_stock_value

            transaction = Transaction(
                PORTFOLIOID=portfolio.PORTFOLIOID,
                SYMBOL=symbol,
                TRANSACTIONDATE=datetime.utcnow(),
                QUANTITY=-quantity,
                TRANSACTIONPRICE=portfolio_detail.LASTCLOSINGPRICE,
                CURRENTTOTALVALUE=portfolio_detail.TOTALSTOCKVALUE,
                TRANSACTIONTYPE='sell'
            )
            db.session.add(transaction)

            # Update portfolio total value
            portfolio.TOTALPORTFOLIOVALUE -= (portfolio_detail.LASTCLOSINGPRICE * quantity)

            if portfolio_detail.QUANTITY == 0:
                db.session.delete(portfolio_detail)

            db.session.commit()

            message = f"Successfully sold {quantity} shares of {symbol}."
            if portfolio_detail.QUANTITY == 0:
                message = f"Successfully sold all shares of {symbol}."

            response = jsonify({"message": message})
            return add_cors_headers(response), 200
        except Exception as e:
            app.logger.error(f"Error: {e}")
            response = jsonify({"error": f"Failed to sell stock: {e}"})
            return add_cors_headers(response), 500


# Route for removing stocks from a user's portfolio
@app.route('/users/<int:user_id>/remove/<symbol>', methods=['POST'])
@token_required
def remove_stocks(user_id, symbol):
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response())
    
    data = request.get_json()
    symbol = data.get('symbol')
    quantity = int(data.get('quantity', 0))  # Added quantity parameter
    
    # Call the StockTransactionAPI method for removing stock with the specified quantity
    transaction_api = StockTransactionAPI()
    result = transaction_api.remove_stock(user_id, symbol, quantity)
    
    return add_cors_headers(result)


@app.route('/users/<int:user_id>/buy/<symbol>', methods=['POST'])
@token_required
def buy_stocks(user_id, symbol):
    if request.method == 'OPTIONS':
        return add_cors_headers(make_response())
    """
    Endpoint for buying a specific quantity of a stock for a user's portfolio.
    """
    data = request.get_json()
    symbol = data.get('symbol')
    quantity = int(data.get('quantity', 0))  # Default to 0 if not provided
    
    # Call the StockTransactionAPI method for buying stock
    transaction_api = StockTransactionAPI()
    result = transaction_api.buy_stock(user_id, symbol, quantity)
    
    return add_cors_headers(result)

BASE_URL = 'https://www.alphavantage.co/query'


def get_historical_stock_data_adjusted(symbol):
    """
    Fetches the last 12 months of adjusted closing prices for a given stock symbol
    using the TIME_SERIES_MONTHLY_ADJUSTED endpoint.
    """
    params = {
        "function": "TIME_SERIES_MONTHLY_ADJUSTED",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_API_KEY
    }
    
    response = requests.get(BASE_URL, params=params)
    if response.status_code == 200:
        data = response.json()
        monthly_data = data.get("Monthly Adjusted Time Series", {})
        
        # Extract the last 12 months of data
        historical_data = []
        for date_str, details in sorted(monthly_data.items(), reverse=True)[:12]:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            formatted_date = date_obj.strftime("%b %d, %Y")
            adjusted_close_price = details.get("5. adjusted close")
            # convert adjusted close price to float
            if adjusted_close_price:
                adjusted_close_price = float(adjusted_close_price)
            historical_data.append({
                "date": formatted_date,
                "adjustedClosingPrice": adjusted_close_price
            })
        return historical_data
    else:
        return None

@app.route('/stocks/<symbol>/', methods=['GET', 'OPTIONS'])
def historical_data_adjusted(symbol):
    if request.method == 'OPTIONS':
        # Directly create a response object for OPTIONS and add CORS headers
        response = make_response()
        response = add_cors_headers(response)
        return response, 200  # Explicitly return 200 OK for OPTIONS

    # Proceed as normal for GET requests
    historical_data = get_historical_stock_data_adjusted(symbol)
    if historical_data:
        response = jsonify(historical_data)
        response = add_cors_headers(response)  # Ensure CORS headers are added
        return response, 200
    else:
        response = jsonify({"error": "Failed to fetch historical data"})
        response = add_cors_headers(response)  # Ensure CORS headers are added
        return response, 500
if __name__ == "__main__":
    app.run(debug=True)