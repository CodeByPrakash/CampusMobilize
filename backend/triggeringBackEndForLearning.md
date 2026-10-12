# Trigger full retraining on your deployed Render service
```
curl -X POST "https://<your-render-service>.onrender.com/api/v1/ai/continuous-learning/retrain?target=all"
```
# Or check live buffer statistics and drift alerts
```
curl -X GET "https://<your-render-service>.onrender.com/api/v1/ai/continuous-learning/status"
```
```
# 1. Trigger Full Retraining (Both Utility Forecasters + Complaint Classifier)
python -m app.ai.continuous_learning --target all

# 2. Retrain Only Utility Forecasting Models (Electricity & Water)
python -m app.ai.continuous_learning --target utilities

# 3. Retrain Only Complaint Classifier with Human Operator Feedback
python -m app.ai.continuous_learning --target classifier

# 4. Inspect Current Learning Status and Buffer Counts (Without Retraining)
python -m app.ai.continuous_learning --status-only
```