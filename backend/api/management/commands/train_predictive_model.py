from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Employee, AttendanceRecord
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import numpy as np
import os

class ConstantModel:
    """A model that always predicts the same constant value"""
    def __init__(self, constant_value):
        self.constant_value = constant_value
    
    def predict(self, X):
        return np.full(X.shape[0], self.constant_value)

class Command(BaseCommand):
    help = "Train ML models to predict employee metrics with complete data requirements"

    def handle(self, *args, **options):
        # Calculate date boundaries
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Step 1: Collect data with strict filtering
        employees = Employee.objects.filter(
            join_date__isnull=False,
            join_date__lt=yesterday
        ).select_related(
            'user',
            'region',
            'highest_education_degree',
            'highest_education_field'
        )
        
        data = []
        skipped_employees = []
        
        for employee in employees:
            skip_reasons = []
            
            # Check attendance records
            if not AttendanceRecord.objects.filter(user=employee.user).exists():
                skip_reasons.append("no attendance records")
            
            # Check required fields
            required_fields = {
                "region": employee.region,
                "highest_education_degree": employee.highest_education_degree,
                "highest_education_field": employee.highest_education_field,
                "years_of_experience": employee.years_of_experience,
                "had_leadership_role": employee.had_leadership_role,
                "percentage_of_matching_skills": employee.percentage_of_matching_skills,
                "has_position_related_high_education": employee.has_position_related_high_education,
                "basic_salary": employee.basic_salary,
            }
            
            missing_fields = [field for field, value in required_fields.items() if value is None]
            if missing_fields:
                skip_reasons.append(f"missing fields: {', '.join(missing_fields)}")
            
            # Check metrics - handle cases where averages might be None due to division by zero
            metrics = {
                "avg_task_ratings": employee.avg_task_ratings,
                "avg_time_remaining": employee.avg_time_remaining_before_deadline,
                "avg_overtime_hours": employee.avg_overtime_hours,
                "avg_lateness_hours": employee.avg_lateness_hours,
                "avg_absent_days": employee.avg_absent_days,
            }
            
            # For new employees who haven't completed any tasks/days, we might want to use 0 instead of None
            if employee.number_of_accepted_tasks == 0:
                skip_reasons.append("no completed tasks (0 tasks)")


            if employee.number_of_non_holiday_days_since_join == 0:
                skip_reasons.append("no work days recorded (0 days)")
            
            # If we still have None values (shouldn't happen with the above handling)
            missing_metrics = [metric for metric, value in metrics.items() if value is None]
            if missing_metrics:
                skip_reasons.append(f"missing metrics: {', '.join(missing_metrics)}")

            if skip_reasons:
                skipped_employees.append({
                    "id": employee.id,
                    "name": str(employee),
                    "reasons": ", ".join(skip_reasons)
                })
                continue
                
            # If all checks passed, add to data
            data.append({
                "distance": employee.region.distance_to_work,
                "education_degree": employee.highest_education_degree.id,
                "education_field": employee.highest_education_field.id,
                "years_of_experience": employee.years_of_experience,
                "had_leadership_role": int(employee.had_leadership_role),
                "percentage_of_matching_skills": employee.percentage_of_matching_skills,
                "has_position_related_high_education": int(employee.has_position_related_high_education),
                "basic_salary": employee.basic_salary,
                "avg_task_ratings": metrics["avg_task_ratings"],
                "avg_time_remaining": metrics["avg_time_remaining"],
                "avg_overtime_hours": metrics["avg_overtime_hours"],
                "avg_lateness_hours": metrics["avg_lateness_hours"],
                "avg_absent_days": metrics["avg_absent_days"],
            })

        # Reporting
        self.stdout.write(f"Processed {len(data)} employees with complete data")
        self.stdout.write(f"Skipped {len(skipped_employees)} employees due to incomplete data")
        
        if skipped_employees:
            self.stdout.write("\nSkipped employees report:")
            for emp in skipped_employees:
                self.stdout.write(f"ID: {emp['id']}, Name: {emp['name']}, Reasons: {emp['reasons']}")
        
        if not data:
            self.stdout.write(self.style.ERROR("No valid employee data available for training."))
            return

        
        if not data:
            self.stdout.write(self.style.ERROR("No valid employee data available for training."))
            return

        # Step 2: Prepare data for training
        df = pd.DataFrame(data)
        
        # Convert all columns to numeric (just in case)
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Drop any rows that might have gotten NA values during conversion
        df = df.dropna()
        
        if df.empty:
            self.stdout.write(self.style.ERROR("No valid data remaining after cleaning."))
            return

        # Features and targets
        X = df[[
            "distance", "education_degree", "education_field",
            "years_of_experience", "had_leadership_role",
            "percentage_of_matching_skills", "has_position_related_high_education"
        ]]
        
        targets = {
            "salary": df["basic_salary"],
            "task_ratings": df["avg_task_ratings"],
            "time_remaining": df["avg_time_remaining"],
            "overtime_hours": df["avg_overtime_hours"],
            "lateness_hours": df["avg_lateness_hours"],
            "absent_days": df["avg_absent_days"]
        }

        # Step 3: Train and save models
        models = {}
        model_types = {
            'constant': 0,
            'random_forest': 0
        }

        for target_name, y in targets.items():
            unique_values = y.nunique()
            value_range = f"{y.min():.2f}-{y.max():.2f}" if len(y) > 0 else "N/A"
            value_distribution = y.value_counts().to_dict()
            
            # Case 1: No variation - create constant model
            if unique_values <= 1:
                constant_value = y.iloc[0] if len(y) > 0 else 0
                self.stdout.write(f"\nCreating constant model for {target_name}:")
                self.stdout.write(f"- Always predicts: {constant_value:.2f}")
                self.stdout.write(f"- Value distribution: {value_distribution}")
                model = ConstantModel(constant_value)
                model_types['constant'] += 1
            
            # Case 2: Some variation - train RandomForest
            else:
                self.stdout.write(f"\nTraining RandomForest for {target_name}:")
                self.stdout.write(f"- Unique values: {unique_values}")
                self.stdout.write(f"- Value range: {value_range}")
                self.stdout.write(f"- Distribution: {dict(sorted(value_distribution.items()))}")
                
                model = RandomForestRegressor(
                    n_estimators=100,
                    random_state=42,
                    n_jobs=-1
                )
                model.fit(X, y)
                model_types['random_forest'] += 1
            
            # Save all models
            models[target_name] = model
            # Create the directory if it doesn't exist
            MODELS_DIR = os.path.join('api', 'predictive_models')
            os.makedirs(MODELS_DIR, exist_ok=True)

            # Then modify the saving line to:
            joblib.dump(model, os.path.join(MODELS_DIR, f'{target_name}_model.pkl'))

        # Enhanced final report
        self.stdout.write(self.style.SUCCESS(
            f"\n=== FINAL MODEL REPORT ===\n"
            f"\nSUMMARY STATISTICS:"
            f"\n- Total models created: {len(targets)}"
            f"\n- Constant models: {model_types['constant']}"
            f"\n- RandomForest models: {model_types['random_forest']}"
            f"\n- Employees used: {len(df)}/{len(employees)} ({(len(df)/len(employees)*100):.1f}%)"
            f"\n- Features used: {list(X.columns)}"
            f"\n\nDETAILED MODEL ANALYSIS:"
        ))

        # Detailed model information
        for target_name, model in models.items():
            y = targets[target_name]
            unique_values = y.nunique()
            value_range = f"{y.min():.2f}-{y.max():.2f}" if len(y) > 0 else "N/A"
            value_distribution = y.value_counts().to_dict()
            
            self.stdout.write(f"\n{target_name.upper()} MODEL:")
            
            if isinstance(model, ConstantModel):
                self.stdout.write(f"- TYPE: Constant predictor")
                self.stdout.write(f"- OUTPUT VALUE: {model.constant_value:.2f}")
                self.stdout.write(f"- DISTRIBUTION: {value_distribution}")
            else:
                self.stdout.write(f"- TYPE: RandomForest ({len(model.estimators_)} trees)")
                self.stdout.write(f"- VALUE RANGE: {value_range}")
                self.stdout.write(f"- UNIQUE VALUES: {unique_values}")
                self.stdout.write(f"- FEATURE IMPORTANCES:")
                for name, importance in zip(X.columns, model.feature_importances_):
                    self.stdout.write(f"  • {name:<30}: {importance:.3f}")
                
                # Add correlation information
                corr_with_target = X.corrwith(y)
                self.stdout.write(f"- FEATURE CORRELATIONS:")
                for feat, corr in corr_with_target.items():
                    self.stdout.write(f"  • {feat:<30}: {corr:.3f}")

        self.stdout.write(self.style.SUCCESS(
            "\n\n=== MODEL TRAINING COMPLETE ==="
        ))