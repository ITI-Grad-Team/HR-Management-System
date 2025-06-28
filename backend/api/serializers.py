from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    BasicInfo, HR, Employee, ApplicationLink, Skill,
    InterviewQuestion, OvertimeClaim, Task, File,
    Position, Report
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class BasicInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BasicInfo
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basicinfo = BasicInfoSerializer(read_only=True, source='user.basicinfo')

    class Meta:
        model = Employee
        fields = '__all__'


class HRSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    basicinfo = BasicInfoSerializer(read_only=True, source='user.basicinfo')
    class Meta:
        model = HR
        fields = '__all__'

class ApplicationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationLink
        fields = '__all__'

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = '__all__'

class OvertimeClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeClaim
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = '__all__'

class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'
